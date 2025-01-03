import { Hono } from 'hono'
import { fetchApiResponse, status } from './constant'
import { env } from 'hono/adapter'
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { paymentTable, paymentTable } from './db/schema'
import { eq } from 'drizzle-orm/expressions'
const app = new Hono()
const fetchPayment = async () => {
  try {
    const response = await fetchApiResponse();
  
    if ("error" in response) {
      return {
       status : "error",
       error: response.error
      }
    } else {
      return  {
        status : response.status,
        amount: response.amount,
        amount_paid:response.amount_paid
      }
      
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
}




app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get("/payment", async (c)=>{
  const id = c.req.query("userid");
  if (id === undefined) {
    return c.json({
      error: "User ID is required",
      status: "error",
    })
  }
  else {
    const {DATABSE_URL} = env<{DATABSE_URL:string}>(c);
    const sql = neon(DATABSE_URL);
  const db = drizzle(sql);
  try {
    const res = await fetchPayment().then((rese)=>rese);
    if (res?.status === "error") {
      return c.json({
        error: res.error,
        status: res.status,
      });
    } else {
      try {
      
            if ((res?.amount_paid ?? 0) > 0){
              const userexist = await db.select().from(paymentTable).where(eq(paymentTable.userid, Number(id))).then((res) => res.length > 0);
              userexist ? {

              } : {

              }
              const previousamt = await db.select({ amount: paymentTable.amount }).from(paymentTable).where(eq(paymentTable.userid, Number(id))).then((res) => res[0]?.amount ?? 0);
              const newamt = previousamt + Number(res?.amount_paid);
              const userPayment:typeof paymentTable.$inferInsert = {
                userid: Number(id),
                amount: Number(res?.amount_paid)
              }
              await db.insert(paymentTable).values(userPayment).then((res) => res);
            }
        
      }
      catch(err){
             console.log(err)
      }
     
    }
  }
  catch(err){
    console.log(err)
  }
    
    return c.text(`Payment ID: ${id}`)
  }
  









app.get('/hello', () => new Response('This is /hello'))

});
export default app