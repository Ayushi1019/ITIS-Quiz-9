const express = require('express');
const pool = require("./db/database");
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')

const app = express();
const port = 3000;
const router = express.Router()

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

app.use((req, res, next) =>{
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin','*');
  next();
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/say', async function (req, res) {
  const keyword = req.query.keyword
  const host = "https://3mtgcwkmsc.execute-api.us-east-1.amazonaws.com/"
  await axios.get(host+'say/dev?keyword='+keyword)
  .then(r=>res.status(200).json(r.data))
  .catch(err=>{
          console.log(err)
          res.send(err)
  })
})

app.get('/orders', async function (req, res) {
        const query = 'Select * from orders'
        const rows = await pool.query(query);
        res.status(200).json(rows);
})

app.get('/orders_by_agent_code', async (req,res)=>{
        const query = 'Select avg(ORD_AMOUNT),AGENT_CODE from orders group by AGENT_CODE'
        const rows = await pool.query(query);
        res.status(200).json(rows);
})

app.get('/usa_orders', async function (req, res) {
        const query = 'Select customer.CUST_NAME from customer join orders on orders.CUST_CODE = customer.CUST_CODE where customer.CUST_COUNTRY="USA"'
        const rows = await pool.query(query);
        res.status(200).json(rows);
})

app.get('/agents_by_city/:city', async function (req, res) {
  const city = req.params.city
  const query = 'Select agents.AGENT_NAME,max(orders.ORD_AMOUNT) from orders join agents on orders.AGENT_CODE = agents.AGENT_CODE where agents.WORKING_AREA=?'
  const rows = await pool.query(query,[city]);
  res.status(200).json(rows);
})

app.post('/agent',async function (req,res){

  let agent_code = req.body.agent_code
  let agent_name = req.body.agent_name
  let agent_area = req.body.agent_area
  let agent_commission = req.body.agent_commission
  let agent_phone = req.body.agent_phone
  let agent_country = req.body.agent_country

  let agents_list = await pool.query("Select AGENT_CODE from agents where AGENT_CODE=?",[agent_code])
  if (agents_list.length == 1){
    res.status(400).json({"message": "Agent_code already present"})
  }
  else if(agent_code.length < 4 && agent_name == ''){
    res.status(400).send("Error with agent_Code or agent_name")
  }
  else{
    try{
      const query = 'Insert into agents values(?,?,?,?,?,?)'
      await pool.query(query,[agent_code,agent_name,agent_area,agent_commission,agent_phone,agent_country]);
      res.status(202).json({"message":"Agent Added"})
    }
    catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
         res.status(400).json({"err":"Agent Code Already exists"})
      } else {
          res.status(400).send(err)
       }
   }
  }

})

app.put('/agent/',async function (req,res){
  const agent_code = req.body.agent_code
  const agent_name = req.body.agent_name
  const agent_area = req.body.agent_area
  const agent_commission = req.body.agent_commission
  const agent_phone = req.body.agent_phone
  const agent_country = req.body.agent_country

  let agents_list = await pool.query("Select AGENT_CODE from agents where AGENT_CODE=?",[agent_code])
  if (agents_list.length == 0 && agent_name != ''){
    const insert_query = "Insert into agents values(?,?,?,?,?,?)"
    await pool.query(insert_query,[agent_code,agent_name,agent_area,agent_commission,agent_phone,agent_country])
    res.status(200).json({"message":"Agent Added"})
  }
  else if(agent_code.length < 4 && agent_name == ''){
    res.status(400).send("Error with agent_Code or agent_name")
  }
  else{
    try{
      let query = 'Update agents set AGENT_NAME=? and WORKING_AREA=? and COMMISSION=? and PHONE_NO=? and COUNTRY=? where AGENT_CODE=?'
      await pool.query(query,[agent_name,agent_area,agent_commission,agent_phone,agent_country,agent_code]);
      res.status(202).json({"message":"Agent Updated"})
    }
    catch (err) {
      res.status(400).send(err)
   }
  }

})

app.patch('/edit_agent_name/:agent_code',async function (req,res){
  const agent_code = req.params.agent_code
  const agent_name = req.body.agent_name

  let agents_list = await pool.query("Select AGENT_CODE from agents where AGENT_CODE=?",[agent_code])
  if(agent_name == '' && agents_list.lenth == 0){
    res.status(400).send("Error with agent_Code or agent_name")
  }
  else{
    try{
      const query = 'Update agents set AGENT_NAME=? where AGENT_CODE=?'
      const rows = await pool.query(query,[agent_code,agent_name]);
      res.status(202).json({"message":"Agent Updated"})
    }
    catch (err) {
      res.status(400).send(err)
   }
  }

})

app.delete('/agent/:agent_code',async function (req,res){
  const agent_code = req.params.agent_code

  let agents_list = await pool.query("Select AGENT_CODE from agents where AGENT_CODE=?",[agent_code])
  if(agents_list.length == 0){
    res.status(400).send("Agent code does not exists!")
  }
  else{
    try{
      const query = 'DELETE from agents where AGENT_CODE=?'
      const rows = await pool.query(query,[agent_code]);
      res.status(204).send()
    }
    catch (err) {
      res.status(400).send(err)
   }
  }

})


app.listen(port, function () {
  console.log('App listening at http://localhost/%s', port)
})
