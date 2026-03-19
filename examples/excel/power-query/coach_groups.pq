let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    Url = BaseUrl & "/api/external/groups?format=csv",
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
            {"ID groupe", Int64.Type},
            {"Nombre de coachs", Int64.Type},
            {"Membres", Int64.Type},
            {"Candidatures", Int64.Type},
            {"Entretiens", Int64.Type}
        },
        "fr-FR"
    ),
    ParsedDates = Table.TransformColumns(
        TypedNumbers,
        {
            {
                "Créé le",
                each try DateTimeZone.RemoveZone(DateTimeZone.FromText(Text.BeforeDelimiter(_, " ("), [Culture = "en-US"])) otherwise null,
                type datetime
            }
        }
    )
in
    ParsedDates
