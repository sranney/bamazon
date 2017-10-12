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
	if (err){
		console.log(err);
	} else {

		console.log("Welcome to Bamazon, the Bash Amazon app.");
		getPrompt();
	}
});

function getPrompt(){
	var choices = [
		"View Product Sales by Department",
		"Create New Department"
	];
	inquirer.prompt([
	{
		name:"userChoice",
		message:"Choose what you'd like to do",
		choices:choices,
		type:"list"
	}
	]).then(function(response){
		choices.indexOf(response.userChoice)==0? showProfits() : createDepartment();
	})	
}


function showProfits(){
	mysqlCon.query("create function if not exists split_str"+
					"(x varchar(255),"+
					"delim varchar(12),"+
					"pos int)"+
					"returns varchar(255)"+
					"return replace(substring(substring_index(x, delim, pos),"+
					"length(substring_index(x, delim, pos -1)) + 1),delim, '')",
					function(err,response,fields){
		var select = "select a.*,";
		select += "sum(b.product_sales) as total_revenue,";
		select += "sum(b.product_sales) - a.over_head_costs as total_profit";
		var subQuery = "(select product_name,";
		subQuery += "split_str(category,'/',1) as first,";
		subQuery += "split_str(category,'/',2) as second,";
		subQuery += "split_str(category,'/',3) as third,";
		subQuery += "split_str(category,'/',4) as fourth,";
		subQuery += "split_str(category,'/',5) as fifth,";
		subQuery += "split_str(category,'/',6) as sixth,";
		subQuery += "split_str(category,'/',7) as seventh,";
		subQuery += "split_str(category,'/',8) as eighth,";
		subQuery += "split_str(category,'/',9) as ninth,product_sales from products)";
		var join = "on a.department_name = b.first ";
		join +="or a.department_name = b.second ";
		join += "or a.department_name = b.third ";
		join += "or a.department_name = b.fourth ";
		join += "or a.department_name = b.fifth ";
		join += "or a.department_name = b.sixth ";
		join += "or a.department_name = b.seventh ";
		join += "or a.department_name = b.eighth ";
		join += "or a.department_name = b.ninth ";
		var groupBy = "group by department_name;"
		mysqlCon.query(select + " from departments a inner join " + subQuery + " b " + join + groupBy,function (err,response,fields){
							console.table(response);
							getPrompt();
						});
	});
}

function createDepartment(){
	inquirer.prompt([
		{
			name:"dept",
			message:"enter name of department:",
			type:"input"
		},
		{
			name:"expense",
			message:"enter the expected overhead cost associated with this department:",
			type:"input"
		}
	]).then(function(inq){
		var findQuery = "select count(*) from departments where department_name = '" + inq.dept + "'";
		mysqlCon.query(findQuery,function(err,response_sql,fields){
			if(response_sql[0]["count(*)"]>0){
				console.log("department already exists. Please try again.");
				createDepartment();
			} else {
				var findQuery = "insert into departments (department_name,over_head_costs) values ('"+inq.dept+"',"+inq.expense+");";
				mysqlCon.query(findQuery,function(err,response_sql2,fields){
					console.log("department created");
					getPrompt();
				})
			}
		})
	})
}