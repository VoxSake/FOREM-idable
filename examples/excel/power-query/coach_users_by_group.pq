let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    GroupId = Excel.CurrentWorkbook(){[Name="GroupId"]}[Content]{0}[Column1],
    Url = BaseUrl & "/api/external/users?groupId=" & Text.From(GroupId) & "&format=csv",
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
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true]),
    TypedNumbers = Table.TransformColumnTypes(
        PromotedHeaders,
        {
            {"ID", Int64.Type},
            {"Candidatures", Int64.Type},
            {"Entretiens", Int64.Type},
            {"Relances dues", Int64.Type},
            {"Acceptées", Int64.Type},
            {"Refusées", Int64.Type},
            {"En cours", Int64.Type}
        },
        "fr-FR"
    ),
    ParsedDates = Table.TransformColumns(
        TypedNumbers,
        {
            {
                "Dernière activité",
                each try DateTimeZone.RemoveZone(DateTimeZone.FromText(Text.BeforeDelimiter(_, " ("), [Culture = "en-US"])) otherwise null,
                type datetime
            }
        }
    )
in
    ParsedDates
