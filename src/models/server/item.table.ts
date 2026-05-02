import { Permission, Role } from "node-appwrite";
import { db, itemTable } from "../name";
import { tablesDB } from "../server/config";

export default async function createItemTable(){
    await tablesDB.createTable(db, itemTable, itemTable, [
       Permission.read(Role.users()),
       Permission.create(Role.users()),
       Permission.update(Role.users()),
       Permission.delete(Role.users()),
    ], true)
    console.log("Item table is created");
    
    await Promise.all([
        tablesDB.createStringColumn(db, itemTable, "productId", 100, true),
        tablesDB.createStringColumn(db, itemTable, "productName", 1000, true),
        tablesDB.createStringColumn(db, itemTable, "slug", 1000, true),
        tablesDB.createIntegerColumn(db, itemTable, "quantity", true, 1),
        tablesDB.createFloatColumn(db, itemTable, "price", true, 0.00),
    ])
    console.log("Item column is created");
    
}
