import { describe, expect, it } from "vitest";
import { validateSelect } from "./guard";
import { ALL_TABLES } from "../config";

const allowed = [...ALL_TABLES];
const ok = (q: string) => expect(validateSelect(q, allowed).ok, q).toBe(true);
const bad = (q: string) => expect(validateSelect(q, allowed).ok, q).toBe(false);

describe("validateSelect", () => {
  it("accepts selects, joins, CTEs, unions, trailing semicolon", () => {
    ok("SELECT TOP 5 customer_id, company_name FROM dbo.customers ORDER BY annual_revenue DESC");
    ok("SELECT c.company_name, SUM(i.total_amount) AS paid FROM customers c JOIN invoices i ON i.customer_id = c.customer_id WHERE i.payment_status = 'Paid' GROUP BY c.company_name;");
    ok("WITH x AS (SELECT customer_id FROM customers) SELECT * FROM x");
    ok("SELECT region FROM customers UNION SELECT region FROM leads");
    ok("SELECT * FROM customers WHERE company_name = 'drop; -- exec into'");
  });

  it("rejects writes, DDL and exec", () => {
    bad("DELETE FROM invoices");
    bad("UPDATE customers SET region = 'x'");
    bad("INSERT INTO customers (company_name) VALUES ('x')");
    bad("DROP TABLE customers");
    bad("EXEC sp_who");
    bad("SELECT * INTO tmp FROM customers");
  });

  it("rejects multi-statement and comments", () => {
    bad("SELECT 1 FROM customers; DROP TABLE customers");
    bad("SELECT 1 FROM customers; SELECT 2 FROM customers");
    bad("SELECT * FROM customers -- hi");
    bad("SELECT * FROM customers /* hi */");
  });

  it("rejects system objects, other schemas and unapproved tables", () => {
    bad("SELECT * FROM sys.tables");
    bad("SELECT * FROM INFORMATION_SCHEMA.COLUMNS");
    bad("SELECT * FROM other.customers");
    bad("SELECT * FROM secrets");
    bad("SELECT @@version");
    bad("SELECT * FROM OPENROWSET('x','y','z')");
  });

  it("respects a narrowed allowlist", () => {
    expect(validateSelect("SELECT * FROM invoices", ["customers"]).ok).toBe(false);
    expect(validateSelect("SELECT * FROM customers", ["customers"]).ok).toBe(true);
  });

  it("rejects empty and oversize input", () => {
    bad("   ");
    bad("SELECT " + "a,".repeat(3000) + "b FROM customers");
  });
});
