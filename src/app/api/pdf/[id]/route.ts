import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        if (!id) {
            return new NextResponse("Missing job ID", { status: 400 });
        }

        const foremApiUrl = `https://www.leforem.be/recherche-offres/api/offre-detail/${id}/pdf`;

        // Proxy the fetch to the Forem API server-side
        // This solves all CORS issues and allows us to circumvent the client-side Blob generation process.
        const response = await fetch(foremApiUrl, {
            method: "GET",
            headers: {
                "Accept": "application/pdf,application/json, text/plain, */*",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.leforem.be/recherche-offres/offres"
            }
        });

        if (!response.ok) {
            console.error("Forem API PDF Error:", response.status, response.statusText);
            return new NextResponse("PDF not found or unavailable on Forem servers", { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                // "inline" opens it in the browser, "attachment" downloads it
                "Content-Disposition": `inline; filename="Offre_Forem_${id}.pdf"`,
                "Cache-Control": "public, max-age=3600",
            },
        });

    } catch (error) {
        console.error("Error bypassing Forem PDF blob API:", error);
        return new NextResponse("Internal proxy server error", { status: 500 });
    }
}
