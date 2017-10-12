var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");

var mysqlCon = mysql.createConnection({
	host:"localhost",
	user:"root",
	password:"xxxxxx",
	database:"bamazon"
});

mysqlCon.connect(function(err){
	if (err){console.log(err);}
	else {console.log("Welcome to Bamazon, the Bash Amazon app.");}
	getPrompt();
});

function getPrompt(){

	var choices = [
		"View Products for Sale",
		"View Low Inventory",
		"Add to Inventory",
		"Add New Product",
		"Suggest Sale on Product"
	];

	inquirer.prompt([{name:"selectedAction",message:"Choose what you want to do:",choices:choices,type:"list"}]).then(function(response){
		if(choices.indexOf(response.selectedAction)==0){
			viewProducts();
		} else if(choices.indexOf(response.selectedAction)==1){
			viewLowInventory();
		} else if(choices.indexOf(response.selectedAction)==2){
			increaseInventory();
		} else if(choices.indexOf(response.selectedAction)==3){
			addNewItem();
		} else if(choices.indexOf(response.selectedAction)==3){
			suggestSale();
		}
	});

}

function viewProducts(){
	var sqlQuery = "select * from products";
	mysqlCon.query(sqlQuery,function(err,response_sql,fields){
		console.table(response_sql);
		getPrompt();
	});
}

function viewLowInventory(){
	var sqlQuery = "select * from products where stock_quantity < 50";
	mysqlCon.query(sqlQuery,function(err,response_sql,fields){
		console.table(response_sql);
		getPrompt();
	});
}

function increaseInventory(){
	var sqlQuery = "select * from products";
	mysqlCon.query(sqlQuery,function(err,response_sql,fields){
		console.table(response_sql);
		var ids = [];
		for (var i = 0 ; i < response_sql.length ; i++){
			ids.push(""+response_sql[i].item_id);
		}
		inquirer.prompt([{name:"selectedID",message:"Select the id of the product that you want to update the inventory for:",choices:ids,type:"list"}]).then(function(response_inq){
			var productName = response_sql[parseInt(response_inq.selectedID)-1].product_name;
			inquirer.prompt([{name:"inv_incr",message:"How much do you want to increase the inventory by?",type:"input"}]).then(function(response_inq2){

				var updateQuery = "update products set stock_quantity = stock_quantity + " + response_inq2.inv_incr + " where item_id = " + response_inq.selectedID;
				mysqlCon.query(updateQuery,function(err,response_sql,fields){
					console.log("inventory increased");
					getPrompt();
				})
			});
		});
	});
}

function addNewItem(){

	var findQuery = "select department_name from departments order by 1";
	mysqlCon.query(findQuery,function(err,response,fields){
		var departments=[];
		for (var i = 0 ; i < response.length; i ++){departments.push(response[i].department_name);}
		inquirer.prompt([
			{name:"product_name",message:"enter name for new product",type:"input"},
			{name:"category",message:"choose departments",choices:departments,type:"checkbox"},
			{name:"price",message:"enter price for product",type:"input"},
			{name:"stock_quantity",message:"enter inventory for product",type:"input"}
		]).then(function(response_inq){
			response_inq.category=response_inq.category.join("/");
			var findQuery = "select item_id,count(*) from products where product_name = '" + response_inq.product_name+"'";
			mysqlCon.query(findQuery,function(err,response_sql,fields){
				if(response_sql[0]["count(*)"]>0){
					inquirer.prompt([{name:"confirm",message:response_inq.product_name+" is already being sold. Would you like to increase inventory?",type:"confirm"}]).then(function(response){
						if(response.confirm){
							inquirer.prompt([{name:"quant",message:"How much inventory would you like to add?",type:"input"}]).then(function(response_quant){
								var updateQuery = "update products set stock_quantity = stock_quantity + " + response_quant.quant + " where item_id = " + response_sql[0].item_id;
								mysqlCon.query(updateQuery,function(err,response_sql,fields){
									console.log("inventory increased");
									getPrompt();
								})
							});
						}
					});
				} else {
					var columns = "(product_name,category,price,stock_quantity)";
					var values = "('"+response_inq.product_name+"','"+response_inq.category+"','"+response_inq.price+"','"+response_inq.stock_quantity+"')" 
					var insertQuery = "insert into products "+columns+" values "+values;
					mysqlCon.query(insertQuery,function(err,response,fields){
						console.log("item added");
						getPrompt();
					});
				}
			});
		});
	});
}
