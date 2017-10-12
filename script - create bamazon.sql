create database bamazon;
USE bamazon;

create table products(

	/*unique id for each product*/
	item_id integer(5) auto_increment not null,
    /*name of product*/
    product_name nvarchar(500),
    /*name of department*/
    department_name nvarchar(500),
    /*cost to customer*/
    price decimal(10,2),
    /*how much of the product is available in stores*/
    stock_quantity integer(10),
	/*primary key for products table*/
	primary key (item_id)
);

create table departments(

	/*unique id for each product*/
	department_id integer(5) auto_increment not null,
    /*name of department*/
    department_name nvarchar(500),
    /*a dummy expense you set for each department*/
    over_head_costs decimal(10,2),
    /*how much of the product is available in stores*/
    stock_quantity integer(10),
	/*primary key for departments table*/
	primary key (department_id)

);

alter table products
add column product_sales decimal(10,2) default 0;

/*mock data*/
insert into 
products 
(product_name,department_name,price,stock_quantity) 
values 
("Nintendo 64","Entertainment/Electronics/Game Consoles",50.00,1000),
("Table","Furniture/Leather/Kitchen",450.00,750),
("Laptop","Electronics/Computers",1500.00,1250),
("TV","Entertainment/Electronics/TVs",800.00,500),
("T-Shirt","Clothes",25.00,1500),
("Poster","Entertainment/Art/Wall Furnishings",10.00,250),
("Trumpet","Entertainment/Musical Instruments",5000.00,1750),
("Learning Node.js","Books/Education/Software & Technology",50.00,300),
("Bucky Balls","Entertainment/Toys",50.00,1700),
("Leather Couch","Furniture/Leather/Home",1200.00,350);

select * from products;

ALTER TABLE products
change department_name category nvarchar(500);

drop table departments;
create table departments(
	
		department_id integer(11) auto_increment not null,
        department_name nvarchar(500),
        over_head_costs decimal(10,2),
		primary key (department_id)
);

insert into 
departments
(department_name,over_head_costs)
values
("Entertainment",5000.00),
("Electronics",10000.00),
("Game Consoles",1000.00),
("Furniture",5000.00),
("Leather",5000.00),
("Kitchen",10000.00),
("Computers",1000.00),
("TVs",5000.00),
("Clothes",100.00),
("Art",20.00),
("Wall Furnishings",20.00),
("Musical Instruments",1300.00),
("Books",100.00),
("Education",100.00),
("Software & Technology",100.00),
("Toys",50.00),
("Home",2000.00),
("Movie",300.00),
("Classic Movie",300.00),
("Western",300.00);

