from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "examples" / "excel" / "coach-api-template.xlsx"


GROUP_HEADERS = [
    "ID groupe",
    "Nom groupe",
    "Cree le",
    "Cree par",
    "Manager",
    "Nombre de coachs",
    "Coachs attribues",
    "Membres",
    "Candidatures",
    "Entretiens",
]

USER_HEADERS = [
    "ID",
    "Prenom",
    "Nom",
    "Email",
    "Role",
    "Groupes",
    "Candidatures",
    "Entretiens",
    "Relances dues",
    "Acceptees",
    "Refusees",
    "En cours",
    "Derniere activite",
]

APPLICATION_HEADERS = [
    "User ID",
    "Prenom",
    "Nom",
    "Email",
    "Role",
    "Groupes",
    "Entreprise",
    "Intitule",
    "Type",
    "Lieu",
    "Date envoyee",
    "Date relance",
    "Derniere relance",
    "Date entretien",
    "Details entretien",
    "Statut",
    "Notes",
    "Preuves",
    "Note privee coach",
    "Contributeurs note privee",
    "Notes coach partagees",
    "Contributeurs notes partagees",
    "Lien",
    "PDF",
    "Mis a jour le",
]


def col_name(index: int) -> str:
    result = ""
    n = index
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        result = chr(65 + remainder) + result
    return result


def inline_cell(ref: str, value: str, style: int = 0) -> str:
    return (
        f'<c r="{ref}" t="inlineStr" s="{style}"><is><t xml:space="preserve">'
        f"{escape(value)}</t></is></c>"
    )


def number_cell(ref: str, value: int | float, style: int = 0) -> str:
    return f'<c r="{ref}" s="{style}"><v>{value}</v></c>'


def formula_cell(ref: str, formula: str, style: int = 0) -> str:
    return f'<c r="{ref}" s="{style}"><f>{escape(formula)}</f></c>'


@dataclass
class Sheet:
    name: str
    rows: list[list[str | int | float | tuple[str, str]]]
    widths: list[int]
    freeze_top_row: bool = False

    def xml(self) -> str:
        dim_col = max((len(row) for row in self.rows), default=1)
        dim_row = max(len(self.rows), 1)
        top_left = "A1"
        bottom_right = f"{col_name(dim_col)}{dim_row}"
        cols = "".join(
            f'<col min="{i}" max="{i}" width="{width}" customWidth="1"/>'
            for i, width in enumerate(self.widths, start=1)
        )
        sheet_views = (
            '<sheetViews><sheetView workbookViewId="0">'
            '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
            '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>'
            "</sheetView></sheetViews>"
            if self.freeze_top_row
            else '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
        )

        row_xml = []
        for row_idx, row in enumerate(self.rows, start=1):
            cells = []
            for col_idx, value in enumerate(row, start=1):
                ref = f"{col_name(col_idx)}{row_idx}"
                if isinstance(value, tuple):
                    kind, payload = value
                    if kind == "formula":
                        cells.append(formula_cell(ref, payload, 0))
                    else:
                        raise ValueError(f"Unsupported tuple cell kind: {kind}")
                elif isinstance(value, (int, float)):
                    cells.append(number_cell(ref, value, 0))
                else:
                    style = 1 if row_idx == 1 else 0
                    cells.append(inline_cell(ref, str(value), style))
            row_xml.append(f'<row r="{row_idx}">{"".join(cells)}</row>')

        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f"<dimension ref=\"{top_left}:{bottom_right}\"/>"
            f"{sheet_views}"
            f"<cols>{cols}</cols>"
            f"<sheetData>{''.join(row_xml)}</sheetData>"
            "<pageMargins left=\"0.7\" right=\"0.7\" top=\"0.75\" bottom=\"0.75\" header=\"0.3\" footer=\"0.3\"/>"
            "</worksheet>"
        )


def workbook_xml(sheets: list[Sheet]) -> str:
    sheet_entries = "".join(
        f'<sheet name="{escape(sheet.name)}" sheetId="{idx}" r:id="rId{idx}"/>'
        for idx, sheet in enumerate(sheets, start=1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        "<fileVersion appName=\"Codex\"/>"
        "<workbookPr/>"
        "<bookViews><workbookView xWindow=\"0\" yWindow=\"0\" windowWidth=\"24000\" windowHeight=\"12000\"/></bookViews>"
        f"<sheets>{sheet_entries}</sheets>"
        "<definedNames>"
        "<definedName name=\"ApiKey\">Config!$B$2</definedName>"
        "<definedName name=\"BaseUrl\">Config!$B$3</definedName>"
        "<definedName name=\"GroupId\">Config!$B$4</definedName>"
        "<definedName name=\"SearchText\">Config!$B$5</definedName>"
        "<definedName name=\"Status\">Config!$B$6</definedName>"
        "</definedNames>"
        "<calcPr calcId=\"191029\"/>"
        "</workbook>"
    )


def workbook_rels(count: int) -> str:
    rels = [
        (
            idx,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet",
            f"worksheets/sheet{idx}.xml",
        )
        for idx in range(1, count + 1)
    ]
    rels.append(
        (
            count + 1,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            "styles.xml",
        )
    )
    rel_xml = "".join(
        f'<Relationship Id="rId{rid}" Type="{rtype}" Target="{target}"/>'
        for rid, rtype, target in rels
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f"{rel_xml}"
        "</Relationships>"
    )


def root_rels() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" '
        'Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" '
        'Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" '
        'Target="docProps/app.xml"/>'
        "</Relationships>"
    )


def content_types(count: int) -> str:
    sheet_overrides = "".join(
        f'<Override PartName="/xl/worksheets/sheet{idx}.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for idx in range(1, count + 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        f"{sheet_overrides}"
        '<Override PartName="/xl/styles.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        "</Types>"
    )


def styles_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        "<fonts count=\"2\">"
        "<font><sz val=\"11\"/><name val=\"Aptos\"/></font>"
        "<font><b/><sz val=\"11\"/><name val=\"Aptos\"/></font>"
        "</fonts>"
        "<fills count=\"2\">"
        "<fill><patternFill patternType=\"none\"/></fill>"
        "<fill><patternFill patternType=\"gray125\"/></fill>"
        "</fills>"
        "<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>"
        "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>"
        "<cellXfs count=\"2\">"
        "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>"
        "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/>"
        "</cellXfs>"
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        "</styleSheet>"
    )


def core_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        "<dc:title>Coach API Workbook Template</dc:title>"
        "<dc:creator>Codex</dc:creator>"
        "<cp:lastModifiedBy>Codex</cp:lastModifiedBy>"
        '<dcterms:created xsi:type="dcterms:W3CDTF">2026-03-19T00:00:00Z</dcterms:created>'
        '<dcterms:modified xsi:type="dcterms:W3CDTF">2026-03-19T00:00:00Z</dcterms:modified>'
        "</cp:coreProperties>"
    )


def app_xml(sheet_count: int) -> str:
    titles = "".join(
        f"<vt:lpstr>{name}</vt:lpstr>"
        for name in [
            "Accueil",
            "Config",
            "Guide_Query",
            "Guide_Macros",
            "Groups",
            "Beneficiaires",
            "Applications",
            "Entretiens",
            "Relances_Dues",
            "Dashboard",
            "GraphData",
        ]
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        "<Application>Microsoft Excel</Application>"
        f"<TitlesOfParts><vt:vector size=\"{sheet_count}\" baseType=\"lpstr\">{titles}</vt:vector></TitlesOfParts>"
        "</Properties>"
    )


def home_sheet() -> Sheet:
    rows: list[list[str | int | float | tuple[str, str]]] = [
        ["Classeur coach - API FOREM"],
        ["Objectif", "Suivre les groupes visibles par un coach, leurs beneficiaires et les candidatures."],
        ["Base URL", "http://forem.brisbois.dev"],
        ["Authentification", "Bearer token a saisir dans Config!B2"],
        ["Comment rafraichir", "Dans Excel: Donnees > Requete vide > coller un script .pq > Charger > Actualiser tout"],
        ["Fichiers a utiliser", "examples/excel/power-query/coach_applications_by_group.pq, coach_groups.pq, coach_users_by_group.pq"],
        ["Endpoints utiles", "/api/external/groups?format=csv ; /api/external/users?groupId={GroupId}&format=csv ; /api/external/applications?groupId={GroupId}&format=csv"],
        ["Scope coach", "Un coach ne voit que ses groupes attribues et les beneficiaires visibles dans ces groupes."],
    ]
    return Sheet("Accueil", rows, [26, 110], False)


def config_sheet() -> Sheet:
    rows = [
        ["Parametre", "Valeur", "Notes"],
        ["ApiKey", "", "Laisser vide dans Git. A remplir dans Excel."],
        ["BaseUrl", "http://forem.brisbois.dev", "URL du site cible"],
        ["GroupId", 5, "Groupe par defaut a remplacer"],
        ["SearchText", "", "Recherche libre optionnelle"],
        ["Status", "", "Optionnel: in_progress, follow_up, interview, accepted, rejected"],
        ["Conseil", "Dupliquer le fichier par coach si besoin", "Permet un suivi par portefeuille"],
    ]
    return Sheet("Config", rows, [22, 38, 58], False)


def guide_sheet() -> Sheet:
    query_lines = [
        "Script principal - candidatures par groupe",
        "let",
        '    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],',
        '    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],',
        '    GroupId = Excel.CurrentWorkbook(){[Name="GroupId"]}[Content]{0}[Column1],',
        '    Url = BaseUrl & "/api/external/applications?groupId=" & Text.From(GroupId) & "&format=csv",',
        "    Source = Web.Contents(",
        "        Url,",
        "        [Headers = [Authorization = \"Bearer \" & Text.From(ApiKey)]]",
        "    ),",
        '    CsvData = Csv.Document(Source, [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),',
        "    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])",
        "in",
        "    PromotedHeaders",
    ]
    rows = [["Bloc", "Contenu"]]
    rows.extend([[f"Ligne {idx}", line] for idx, line in enumerate(query_lines, start=1)])
    rows.extend(
        [
            ["Mode d emploi", "1. Copier un fichier .pq du dossier examples/excel/power-query"],
            ["Mode d emploi", "2. Dans Excel: Donnees > Obtenir des donnees > Requete vide > Editeur avance"],
            ["Mode d emploi", "3. Coller le script et charger vers la feuille cible"],
            ["Mode d emploi", "4. Rafraichir avec Actualiser tout"],
        ]
    )
    return Sheet("Guide_Query", rows, [18, 120], False)


def macro_guide_sheet() -> Sheet:
    rows = [
        ["Action", "Detail"],
        ["But", "Ajouter une couche macro simple pour rafraichir les requetes et naviguer entre les feuilles clefs."],
        ["Fichier VBA", "examples/excel/vba/CoachApiTools.bas"],
        ["Import VBA", "Excel Desktop > Alt+F11 > clic droit sur le projet > Importer un fichier"],
        ["Sauvegarde", "Enregistrer ensuite le classeur en .xlsm pour conserver les macros"],
        ["Macro 1", "RefreshCoachWorkbook : lance ThisWorkbook.RefreshAll"],
        ["Macro 2", "GoToDashboard : ouvre la feuille Dashboard"],
        ["Macro 3", "GoToApplications : ouvre la feuille Applications"],
        ["Macro 4", "GoToBeneficiaires : ouvre la feuille Beneficiaires"],
        ["Boutons", "Inserer > Formes > clic droit > Affecter une macro"],
        ["Bouton recommande 1", "Actualiser tout"],
        ["Bouton recommande 2", "Ouvrir dashboard"],
        ["Bouton recommande 3", "Ouvrir candidatures"],
        ["Bouton recommande 4", "Ouvrir beneficiaires"],
        ["Astuce", "Lier aussi la requete groups pour donner au coach une vue portefeuille immediate."],
    ]
    return Sheet("Guide_Macros", rows, [24, 104], False)


def data_sheet(name: str, headers: list[str]) -> Sheet:
    return Sheet(name, [headers], [18] * len(headers), True)


def dashboard_sheet() -> Sheet:
    rows: list[list[str | int | float | tuple[str, str]]] = [
        ["Vue coach", "Valeur", "Commentaire", "Mini visuel"],
        ["Groupes visibles", ("formula", 'MAX(COUNTA(Groups!A:A)-1,0)'), "Nombre de groupes charges depuis l API", ""],
        ["Beneficiaires visibles", ("formula", 'MAX(COUNTA(Beneficiaires!A:A)-1,0)'), "Portefeuille actuellement charge", ""],
        ["Candidatures totales", ("formula", 'MAX(COUNTA(Applications!A:A)-1,0)'), "Volume total du suivi charge", ""],
        ["Entretiens", ("formula", 'COUNTIF(Applications!P:P,"interview")'), "Candidatures en phase entretien", ""],
        ["Acceptees", ("formula", 'COUNTIF(Applications!P:P,"accepted")'), "Placements ou issues positives", ""],
        ["Refusees", ("formula", 'COUNTIF(Applications!P:P,"rejected")'), "Candidatures closes negativement", ""],
        ["En suivi actif", ("formula", 'COUNTIF(Applications!P:P,"in_progress")+COUNTIF(Applications!P:P,"follow_up")'), "Pipeline actif", ""],
        ["Relances dues", ("formula", 'COUNTIF(Applications!L:L,"<>")-COUNTIF(Applications!L:L,"Date relance")'), "Approximation basee sur les dates de relance chargees", ""],
        ["", "", "", ""],
        ["Synthese statuts", "Nb", "% du total", "Barre"],
        ["in_progress", ("formula", 'COUNTIF(Applications!P:P,"in_progress")'), ("formula", 'IF($B$4=0,0,B12/$B$4)'), ("formula", 'REPT("|",ROUND(IF($B$4=0,0,B12/$B$4)*20,0))')],
        ["follow_up", ("formula", 'COUNTIF(Applications!P:P,"follow_up")'), ("formula", 'IF($B$4=0,0,B13/$B$4)'), ("formula", 'REPT("|",ROUND(IF($B$4=0,0,B13/$B$4)*20,0))')],
        ["interview", ("formula", 'COUNTIF(Applications!P:P,"interview")'), ("formula", 'IF($B$4=0,0,B14/$B$4)'), ("formula", 'REPT("|",ROUND(IF($B$4=0,0,B14/$B$4)*20,0))')],
        ["accepted", ("formula", 'COUNTIF(Applications!P:P,"accepted")'), ("formula", 'IF($B$4=0,0,B15/$B$4)'), ("formula", 'REPT("|",ROUND(IF($B$4=0,0,B15/$B$4)*20,0))')],
        ["rejected", ("formula", 'COUNTIF(Applications!P:P,"rejected")'), ("formula", 'IF($B$4=0,0,B16/$B$4)'), ("formula", 'REPT("|",ROUND(IF($B$4=0,0,B16/$B$4)*20,0))')],
        ["", "", "", ""],
        ["Top groupes", "Candidatures", "Beneficiaires", "Lecture"],
        ["Groupe charge 1", ("formula", 'IFERROR(INDEX(Groups!B:B,2),"")'), ("formula", 'IFERROR(INDEX(Groups!H:H,2),"")'), ("formula", 'IFERROR(INDEX(Groups!I:I,2),"")')],
        ["Groupe charge 2", ("formula", 'IFERROR(INDEX(Groups!B:B,3),"")'), ("formula", 'IFERROR(INDEX(Groups!H:H,3),"")'), ("formula", 'IFERROR(INDEX(Groups!I:I,3),"")')],
        ["Groupe charge 3", ("formula", 'IFERROR(INDEX(Groups!B:B,4),"")'), ("formula", 'IFERROR(INDEX(Groups!H:H,4),"")'), ("formula", 'IFERROR(INDEX(Groups!I:I,4),"")')],
        ["", "", "", ""],
        ["Controle portefeuille", "Valeur", "Commentaire", ""],
        ["Beneficiaires avec entretiens", ("formula", 'COUNTIF(Beneficiaires!H:H,">0")'), "Combien de beneficiaires ont au moins un entretien", ""],
        ["Beneficiaires avec relances dues", ("formula", 'COUNTIF(Beneficiaires!I:I,">0")'), "Priorite de suivi coach", ""],
        ["Beneficiaires avec 5+ candidatures", ("formula", 'COUNTIF(Beneficiaires!G:G,">=5")'), "Profils tres actifs", ""],
        ["Derniere activite renseignee", ("formula", 'MAX(Beneficiaires!M:M)'), "Peut etre interpretee comme date texte selon Excel", ""],
        ["", "", "", ""],
        ["Distribution operationnelle", "Valeur", "Formule source", "Usage"],
        ["Entretiens planifies", ("formula", 'COUNTIF(Applications!N:N,"<>")-COUNTIF(Applications!N:N,"Date entretien")'), "Date entretien non vide", "Piloter les accompagnements chauds"],
        ["Lignes avec note privee coach", ("formula", 'COUNTIF(Applications!S:S,"<>")-COUNTIF(Applications!S:S,"Note privee coach")'), "Presence de note privee", "Verifier la couverture du suivi"],
        ["Lignes avec notes partagees", ("formula", 'COUNTIF(Applications!U:U,"<>")-COUNTIF(Applications!U:U,"Notes coach partagees")'), "Presence de notes partagees", "Suivi collaboratif"],
        ["Lignes avec preuve", ("formula", 'COUNTIF(Applications!R:R,"<>")-COUNTIF(Applications!R:R,"Preuves")'), "Presence de preuve", "Controle qualite dossier"],
        ["", "", "", ""],
        ["Lecture", "Le dashboard devient utile apres chargement des requetes Power Query.", "", ""],
        ["Lecture", "Pour de vrais graphiques Excel, inserer un graphique en pointant sur les tableaux de synthese ci-dessus.", "", ""],
    ]
    return Sheet("Dashboard", rows, [28, 18, 48, 24], False)


def graph_data_sheet() -> Sheet:
    rows: list[list[str | int | float | tuple[str, str]]] = [
        ["Serie", "Valeur"],
        ["in_progress", ("formula", 'COUNTIF(Applications!P:P,"in_progress")')],
        ["follow_up", ("formula", 'COUNTIF(Applications!P:P,"follow_up")')],
        ["interview", ("formula", 'COUNTIF(Applications!P:P,"interview")')],
        ["accepted", ("formula", 'COUNTIF(Applications!P:P,"accepted")')],
        ["rejected", ("formula", 'COUNTIF(Applications!P:P,"rejected")')],
        ["", ""],
        ["Portefeuille", "Valeur"],
        ["Beneficiaires", ("formula", 'MAX(COUNTA(Beneficiaires!A:A)-1,0)')],
        ["Candidatures", ("formula", 'MAX(COUNTA(Applications!A:A)-1,0)')],
        ["Entretiens", ("formula", 'COUNTIF(Applications!P:P,"interview")')],
        ["Relances dues", ("formula", 'COUNTIF(Beneficiaires!I:I,">0")')],
    ]
    return Sheet("GraphData", rows, [24, 18], False)


def build_sheets() -> list[Sheet]:
    return [
        home_sheet(),
        config_sheet(),
        guide_sheet(),
        macro_guide_sheet(),
        data_sheet("Groups", GROUP_HEADERS),
        data_sheet("Beneficiaires", USER_HEADERS),
        data_sheet("Applications", APPLICATION_HEADERS),
        data_sheet("Entretiens", APPLICATION_HEADERS),
        data_sheet("Relances_Dues", APPLICATION_HEADERS),
        dashboard_sheet(),
        graph_data_sheet(),
    ]


def generate_workbook() -> None:
    sheets = build_sheets()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types(len(sheets)))
        zf.writestr("_rels/.rels", root_rels())
        zf.writestr("docProps/core.xml", core_xml())
        zf.writestr("docProps/app.xml", app_xml(len(sheets)))
        zf.writestr("xl/workbook.xml", workbook_xml(sheets))
        zf.writestr("xl/_rels/workbook.xml.rels", workbook_rels(len(sheets)))
        zf.writestr("xl/styles.xml", styles_xml())
        for idx, sheet in enumerate(sheets, start=1):
            zf.writestr(f"xl/worksheets/sheet{idx}.xml", sheet.xml())


if __name__ == "__main__":
    generate_workbook()
