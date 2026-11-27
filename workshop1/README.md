# Workshop 1

## Get your Data ready for your RAG

Rename local.settings.example.json to local.settings.json

Copy the credentials from https://docs.google.com/document/d/1n8jc7n50C1VxDVNuezUE2nOtSilXtP-j7D-vPMpMs20/edit?usp=sharing

Paste the copied credentials to local.settings.json

Make sure you enter the `AUDIENCE_NAME` with your name + YOURNUMBERASSIGNED to you eg: karthik3

Update the COSMOS_ENDPOINT with `https://salesintelligence-aiworkshop<YOURNUMBERASSIGNED>.documents.azure.com:443/`




Make sure you give your AUDIENCE_NAME and COSMOS_ENDPOINT is updated.



To upload the KB files in terminal by navigating to workshop1/sales-intelligence-jobs, this command will copy the files to SALES-KB-<AUDIENCE_NAME>

`cd workshop1/sales-intelligence-jobs
npm run ingest:local`

Once the files are copied in the same terminal, run the below command

`npm start`



Navigate to workshop2
