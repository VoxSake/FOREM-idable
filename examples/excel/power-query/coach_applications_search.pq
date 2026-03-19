let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    SearchText = Excel.CurrentWorkbook(){[Name="SearchText"]}[Content]{0}[Column1],
    Url =
        BaseUrl &
        "/api/external/applications?search=" & Uri.EscapeDataString(Text.From(SearchText)) &
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
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true]),
    Typed = Table.TransformColumnTypes(
        PromotedHeaders,
        {
            {"User ID", Int64.Type},
            {"Date envoyee", type datetime},
            {"Date relance", type datetime},
            {"Derniere relance", type datetime},
            {"Date entretien", type datetime},
            {"Mis a jour le", type datetime}
        },
        "fr-FR"
    )
in
    Typed
