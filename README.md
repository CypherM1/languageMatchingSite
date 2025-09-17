# languageMatchingSite
This is a site that you can upload your spreadsheet or csv of a foreign language to English to practice matching.

The file upload supports any spreadsheet that can be read by the xlsx library, because the JS uses SheetJS (XLSX) to parse the file.

Specifically, you can upload:

Excel files
- .xlsx (modern Excel format) ✅
- .xls (older Excel format) ✅

OpenDocument Spreadsheet
- .ods ✅

CSV files
- .csv ✅

Other spreadsheet formats supported by SheetJS:
- .xlsb (Excel binary)
- .fods (Flat XML ODS)

You need the following headers in the following order spelled the following way:

French | English | Word Class | Pronunciation | Full Info
