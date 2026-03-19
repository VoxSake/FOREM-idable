let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    SearchText = Excel.CurrentWorkbook(){[Name="SearchText"]}[Content]{0}[Column1],
    MonthNumber = (m as text) as nullable number =>
        if m = "Jan" then 1
        else if m = "Feb" then 2
        else if m = "Mar" then 3
        else if m = "Apr" then 4
        else if m = "May" then 5
        else if m = "Jun" then 6
        else if m = "Jul" then 7
        else if m = "Aug" then 8
        else if m = "Sep" then 9
        else if m = "Oct" then 10
        else if m = "Nov" then 11
        else if m = "Dec" then 12
        else null,
    ParseJsDate = (value as any) as nullable datetime =>
        let
            txt = try Text.Trim(Text.From(value)) otherwise "",
            noTz = try Text.BeforeDelimiter(txt, " GMT") otherwise txt,
            parts = List.RemoveItems(Text.Split(noTz, " "), {""}),
            monthText = if List.Count(parts) >= 4 then parts{1} else null,
            dayText = if List.Count(parts) >= 4 then parts{2} else null,
            yearText = if List.Count(parts) >= 4 then parts{3} else null,
            timeText = if List.Count(parts) >= 5 then parts{4} else null,
            month = if monthText <> null then MonthNumber(monthText) else null,
            day = try Number.FromText(dayText) otherwise null,
            year = try Number.FromText(yearText) otherwise null,
            timeParts = if timeText <> null then Text.Split(timeText, ":") else {},
            hour = if List.Count(timeParts) = 3 then try Number.FromText(timeParts{0}) otherwise null else null,
            minute = if List.Count(timeParts) = 3 then try Number.FromText(timeParts{1}) otherwise null else null,
            second = if List.Count(timeParts) = 3 then try Number.FromText(timeParts{2}) otherwise null else null,
            result =
                if month <> null and day <> null and year <> null and hour <> null and minute <> null and second <> null then
                    #datetime(year, month, day, hour, minute, second)
                else
                    null
        in
            result,
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
    TypedNumbers = Table.TransformColumnTypes(
        PromotedHeaders,
        {
            {"User ID", Int64.Type}
        },
        "fr-FR"
    ),
    ParsedDates = Table.TransformColumns(
        TypedNumbers,
        {
            {"Date envoyée", each ParseJsDate(_), type datetime},
            {"Date relance", each ParseJsDate(_), type datetime},
            {"Dernière relance", each ParseJsDate(_), type datetime},
            {"Date entretien", each ParseJsDate(_), type datetime},
            {"Mis à jour le", each ParseJsDate(_), type datetime}
        }
    )
in
    ParsedDates
