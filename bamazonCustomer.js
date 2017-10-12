var mysql = require("mysql");
var inquirer = require("inquirer");
var mysqlEscapeArray = require('mysql-escape-array');
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

var itemIDs = [],items;
var viewChoices = ["View the products at the product level.", "Drilldown from the category level to get a filtered view of products"];
function getPrompt(){
	mysqlCon.query("select * from ??","products",function(err,response,fields){
		var nonzeroInventory = [];
		for (var i = 0 ; i < response.length ; i ++){
			if(response[i].stock_quantity>0){
				itemIDs.push(""+response[i].item_id);
				nonzeroInventory.push(response[i]);
			}
		}

		items = response;

		inquirer.prompt([{name:"choice",message:"Choose method that you want to view items",choices:viewChoices,type:"list"}]).then(function(response){
			viewChoices.indexOf(response.choice)==0 ? getallProducts(nonzeroInventory):getallCategories(nonzeroInventory);
		});
	});
}

//this will be an array of objects in which each object is for a specific category
//and another attribute is an array full of items that are in that category

function getallProducts(nonzeroInventory){
	console.table(nonzeroInventory);

	inquirer.prompt([{name:"selectedIDs",message:"Choose ids of products that you'd like to buy.",choices:itemIDs,type:"checkbox"}]).then(function(response){
		response.selectedIDs.length>0? setQuant(response.selectedIDs):getallProducts(nonzeroInventory);
	});
}

var categories = [],categorieslist=[];

function getallCategories(nonzeroInventory){
	var parts = ["products","item_id"];
	mysqlCon.query("select * from ?? where ?? in ('"+itemIDs.join("','")+"')",parts,function(err,response,fields){
		for (var i = 0; i < response.length ; i++){
			var dB_categories = response[i].category.replace(/'/g,"").split("/");
			for (var j = 0 ; j <dB_categories.length ; j++){

				if(categorieslist.indexOf(dB_categories[j])==-1){
					categorieslist.push(dB_categories[j]);
					categories.push({category:dB_categories[j],products:[]});
				}
			}
		}
		for (var i = 0 ; i < categories.length ; i++){
			var category = categories[i].category;
			for (var j = 0 ; j < response.length; j++){
				var cat_inv = response[j].category;
				if(inString(cat_inv,category)>0){
					categories[i].products.push(response[j].product_name);
				}
			}
		}
		catDrilldown();

	})
}

function inString(cat_inv,category){
	var tailString = "/"+category;
	var tailSubstr_length = cat_inv.length - tailString.length;
	var iter1 = cat_inv.indexOf("/"+category+"/")>-1 ? 1:0;
	var iter2 = cat_inv.substr(tailSubstr_length).indexOf("/"+category)>-1 ? 1:0;
	var iter3 = cat_inv.indexOf(category+"/")==0 ? 1:0;
	var iter4 = cat_inv==category ? 1:0;
	return iter1+iter2+iter3+iter4;
}

function catDrilldown(){
	console.table(categories);
	inquirer.prompt([{name:"selectedCat",message:"Here is a list of categories for goods currently on sale. Please choose one to see products in this category.",choices:categorieslist,type:"list"}]).then(function(response_inq){
		var chosenCat = response_inq.selectedCat;
		var categoryProducts = categories[categorieslist.indexOf(response_inq.selectedCat)].products;
		var sqlProductString = categoryProducts.join("','");
		var nonzeroIDs = itemIDs.join("','");
		categoryProducts.push("Go back to category menu");
/*		var sqlQuery = "select * from ?? where ? in ('"+sqlProductString+"')";
		var escapeArray = ["products","product_name"];*/
		var sqlQuery = "select * from products where product_name in ('"+sqlProductString+"')";
		mysqlCon.query(sqlQuery,function(err,response_sql,fields){
			catProducts(categoryProducts,response_sql,chosenCat);
		});
	})
}

function catProducts(categoryProducts,tableData,chosenCat){
	console.table(tableData);
	var sqlQuery = "select ?? from ?? where (category like '"+chosenCat+"/%' or category like '%/"+chosenCat+"/%' or category like '%/"+chosenCat+"') and stock_quantity >0";
	var escapeArray=["item_id","products"];
	mysqlCon.query(sqlQuery,escapeArray,function(err,response_sql,fields){
		var productIDs=[];
		for (var i = 0 ; i < response_sql.length ; i ++){productIDs.push(""+response_sql[i].item_id);}
		inquirer.prompt([{name:"selectedIDs",message:"Here is a list of ids for the products listed in this category",choices:productIDs,type:"checkbox"}]).then(function(response){
			if(categoryProducts.indexOf(response.selectedItem)==(categoryProducts["length"]-1)){
				catDrilldown();
			} else {
				setQuant(response.selectedIDs);
			}
		})
	});
}

var iter = 0,totalCost=0;

function setQuant(ids){
	if(iter<ids.length){
		var itemQuantity = items[parseInt(ids[iter])-1].stock_quantity;
		var itemName = items[parseInt(ids[iter])-1].product_name;
		var itemUnitCost = items[parseInt(ids[iter])-1].price;
		setQuant_inquirer(ids,itemQuantity,itemName,itemUnitCost);
	} else {
		console.log("Your total cost for this order is " + totalCost);
		categories = [];
		categorieslist=[];
		itemIDs=[];
		iter=0;
		totalCost=0;
		getPrompt();
	}
}

function setQuant_inquirer(ids,itemQuantity,itemName,itemUnitCost){
	inquirer.prompt([{name:"Quant",message:"There are " + itemQuantity + " units of " + itemName + " in the inventory. How many do you want to buy?",type:"input"}]).then(function(response){
		if(!response.Quant.match(/[a-z]/i)&&response.Quant.length>0&&response.Quant<=itemQuantity){
			var quant = response.Quant;
			var queryPrompt = "update products set stock_quantity = stock_quantity - " + quant + ",product_sales = product_sales + "+itemUnitCost*quant+" where product_name = '" + itemName + "'";
			mysqlCon.query(queryPrompt,function(err,response,fields){
				iter+=1;
				totalCost += itemUnitCost*quant;
				setQuant(ids);
			})
		} else {
			console.log("invalid user entry. try again");
			setQuant_inquirer(ids,itemQuantity,itemName,itemUnitCost);
		}

	});
}