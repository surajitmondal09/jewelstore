
import { categoryTable, subcategoryTable, db } from "@/models/name";
import { tablesDB } from "@/models/server/config";
import { Query } from "appwrite";
import { NextResponse } from "next/server";


export async function GET() {
    const categories = await tablesDB.listRows(db, categoryTable, [
        Query.select(["categoryName", "$id", "subcategory", "categoryImage"]),
    ])
    console.log(categories);

    return NextResponse.json(categories)
}


export async function POST(request: Request) {
    try {


        const { subcategory }: { subcategory: string[] } = await request.json();
        const subcategorys: { $id: string, subcategoryName: string, subcategoryImage: string }[] = [];

        for (let i = 0; i < subcategory.length; i++) {
            const subcategoryItem = await tablesDB.getRow(db, subcategoryTable, subcategory[i]);
            if (subcategoryItem) {
                subcategorys.push({
                    $id: subcategoryItem.$id,
                    subcategoryName: subcategoryItem.subcategoryName,
                    subcategoryImage: subcategoryItem.subcategoryImage,
                });
            }
        }

        return NextResponse.json(subcategorys)
    } catch (error) {
        return NextResponse.json({ error });    
    }
}
