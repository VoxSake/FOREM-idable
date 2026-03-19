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
    Typed = Table.TransformColumnTypes(
        PromotedHeaders,
        {
            {"ID", Int64.Type},
            {"Candidatures", Int64.Type},
            {"Entretiens", Int64.Type},
            {"Relances dues", Int64.Type},
            {"Acceptees", Int64.Type},
            {"Refusees", Int64.Type},
            {"En cours", Int64.Type},
            {"Derniere activite", type datetime}
        },
        "fr-FR"
    )
in
    Typed
