const express = require('express')
const _ = require('lodash')
const bodyParser = require('body-parser')
const axios = require('axios')
const fs = require('fs')
const app = express();
const dotenv = require("dotenv").config()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : true}))

axios.defaults.headers.get['x-hasura-access-key'] = process.env.VAL;



//For caching and route functions
const saveUserData = (data) => {
    const Data = JSON.stringify(data)
    fs.writeFileSync('result.json', Data)
}

const dataInsight =_.memoize((result)=>{                  //this cash result
    var longest = result.reduce(
        function (a, b) {
            return a.title.length > b.title.length ? a : b;
        }
    );
    let unique_titles = []
    let count = 0
    for(const i of result){
        if(!unique_titles.includes(i.title)){
            unique_titles.push(i.title)
        }
        if(i.title.toLowerCase().includes("privacy")){
            count++
        }
    }
    const data_insight = {
        total_blogs:result.length,
        longest_title:longest.title.length,
        title_includes_privacy:count,
        unique_titles : unique_titles
    }
    return data_insight
})

const searchResults = _.memoize((result,query)=>{
    const required = result.filter((item)=> item.title.includes(query))
    if(required.length===0){
        return("OOPs NOTHING  FOUND!!")
    }else{
        return(required)
    }
})


//For Routes 
app.get("/",async (req,res)=>{ 
    try {
        const data = await axios.get(process.env.URL)   
         saveUserData(data['data']['blogs'])  
         res.send(data['data']) 
    } catch (error) {
     console.log("There is some error while fetching data from the api")
     res.send(error)
    } 
})

app.get("/api/blog-search",async(req,res)=>{ 
    try {
        let rawdata = fs.readFileSync('result.json');
        let result = JSON.parse(rawdata);
        const query = req.query.query

        if(req.query.query){
          res.send(searchResults(result,query)) 
        }else{
            console.log(query)
            res.send(dataInsight(result))
        }
    } catch (error) {
     res.send("There is some error while  calling this end point api")
     console.log(error)
    } 
})
 
app.listen(3000,()=>{
    console.log('Connected successfully to port 3000')
})