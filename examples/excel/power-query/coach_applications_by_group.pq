let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    GroupId = Excel.CurrentWorkbook(){[Name="GroupId"]}[Content]{0}[Column1],
    Status = Excel.CurrentWorkbook(){[Name="Status"]}[Content]{0}[Column1],
    StatusPart =
        if Text.Trim(Text.From(Status)) = "" then
            ""
        else
            "&status=" & Uri.EscapeDataString(Text.From(Status)),
    Url =
        BaseUrl &
        "/api/external/applications?groupId=" & Text.From(GroupId) &
        StatusPart &
        "&format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer " & Text.From(ApiKey)
            ]
        ]
    ),
    CsvData = Csv.Document(
        Source,
        [
            Delimiter = ",",
            Encoding = 65001,
            QuoteStyle = QuoteStyle.Csv
        ]
    ),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
