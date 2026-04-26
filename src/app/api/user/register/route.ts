import { customerTable, db, notificationTable } from "@/models/name";
import { tablesDB, users } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest){
    try {
        const {ID, name, email, avatar} = await request.json()


        console.log(ID, name, email, avatar);
       
            const response = await tablesDB.createRow(db, customerTable, ID as string, {
                avatar: avatar,
                name: name,
                email: email,
                hasUnreadNotification: true
            })

            try {
                await tablesDB.createRow(db, notificationTable, ID as string + Date.now().toString().slice(-6), {
                    userId: ID,
                    notification: `Welcome to Aura Jewels, ${name.split(' ')[0]}! We're glad to have you here. Check out our newest collections!`
                });
            } catch (notifErr) {
                console.error("Failed to create welcome notification", notifErr);
            }
          
            return NextResponse.json(
                response,
                 {
              status: 201
            })
       
    } catch (error: any) {
        return NextResponse.json(
      {
        error: error?.message || "Error creating user row"
      },
      {
        status: error?.status || error?.code || 500
      }
    )
    }
}
