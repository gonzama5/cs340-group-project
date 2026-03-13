/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.5.29-MariaDB, for Linux (x86_64)
--
-- Host: classmysql.engr.oregonstate.edu    Database: cs340_gonzama5
-- ------------------------------------------------------
-- Server version	10.11.15-MariaDB-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Customers`
--

DROP TABLE IF EXISTS `Customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customers` (
  `customer_ID` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(45) NOT NULL,
  `last_name` varchar(45) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  PRIMARY KEY (`customer_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customers`
--

LOCK TABLES `Customers` WRITE;
/*!40000 ALTER TABLE `Customers` DISABLE KEYS */;
INSERT INTO `Customers` VALUES (1,'William','Hogarth','555-123-1111'),(2,'John','Gilbert','555-123-2222'),(3,'Peter','Lely','555-123-3333'),(4,'Jamini','Roy','555-123-4444'),(5,'Frida','Kahlo','555-123-5555');
/*!40000 ALTER TABLE `Customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Invoices`
--

DROP TABLE IF EXISTS `Invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Invoices` (
  `InvoiceID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) DEFAULT NULL,
  `InvoiceDate` datetime DEFAULT NULL,
  `TermsCodeID` varchar(50) DEFAULT NULL,
  `TotalDue` decimal(19,2) DEFAULT NULL,
  PRIMARY KEY (`InvoiceID`),
  KEY `CustomerID` (`CustomerID`),
  KEY `TermsCodeID` (`TermsCodeID`),
  CONSTRAINT `Invoices_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `Customers` (`CustomerID`),
  CONSTRAINT `Invoices_ibfk_2` FOREIGN KEY (`TermsCodeID`) REFERENCES `TermsCode` (`TermsCodeID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Invoices`
--

LOCK TABLES `Invoices` WRITE;
/*!40000 ALTER TABLE `Invoices` DISABLE KEYS */;
INSERT INTO `Invoices` VALUES (1,2,'2014-02-07 00:00:00','NET30',2388.98),(2,1,'0000-00-00 00:00:00','210NET30',2443.35),(3,1,'2014-02-09 00:00:00','NET30',8752.32);
/*!40000 ALTER TABLE `Invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Order_has_Products`
--

DROP TABLE IF EXISTS `Order_has_Products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Order_has_Products` (
  `order_ID` int(11) NOT NULL,
  `product_ID` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  PRIMARY KEY (`order_ID`,`product_ID`),
  KEY `product_ID` (`product_ID`),
  CONSTRAINT `Order_has_Products_ibfk_1` FOREIGN KEY (`order_ID`) REFERENCES `Orders` (`order_ID`) ON DELETE CASCADE,
  CONSTRAINT `Order_has_Products_ibfk_2` FOREIGN KEY (`product_ID`) REFERENCES `Products` (`product_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Order_has_Products`
--

LOCK TABLES `Order_has_Products` WRITE;
/*!40000 ALTER TABLE `Order_has_Products` DISABLE KEYS */;
INSERT INTO `Order_has_Products` VALUES (1,1,2),(1,2,1),(2,3,1),(3,4,2),(3,5,3),(4,2,2);
/*!40000 ALTER TABLE `Order_has_Products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Orders`
--

DROP TABLE IF EXISTS `Orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Orders` (
  `order_ID` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `customer_ID` int(11) NOT NULL,
  PRIMARY KEY (`order_ID`),
  KEY `customer_ID` (`customer_ID`),
  CONSTRAINT `Orders_ibfk_1` FOREIGN KEY (`customer_ID`) REFERENCES `Customers` (`customer_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Orders`
--

LOCK TABLES `Orders` WRITE;
/*!40000 ALTER TABLE `Orders` DISABLE KEYS */;
INSERT INTO `Orders` VALUES (1,'2026-02-01 10:30:00',1),(2,'2026-02-01 11:20:00',2),(3,'2026-02-01 11:50:00',3),(4,'2026-02-01 13:30:00',4);
/*!40000 ALTER TABLE `Orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Product_Types`
--

DROP TABLE IF EXISTS `Product_Types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Product_Types` (
  `category_ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`category_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Product_Types`
--

LOCK TABLES `Product_Types` WRITE;
/*!40000 ALTER TABLE `Product_Types` DISABLE KEYS */;
INSERT INTO `Product_Types` VALUES (1,'Beverages'),(2,'Snacks'),(3,'Dairy'),(4,'Bakery');
/*!40000 ALTER TABLE `Product_Types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Products`
--

DROP TABLE IF EXISTS `Products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Products` (
  `product_ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(6,2) NOT NULL,
  `supplier_ID` int(11) NOT NULL,
  `category_ID` int(11) NOT NULL,
  PRIMARY KEY (`product_ID`),
  KEY `supplier_ID` (`supplier_ID`),
  KEY `category_ID` (`category_ID`),
  CONSTRAINT `Products_ibfk_1` FOREIGN KEY (`supplier_ID`) REFERENCES `Suppliers` (`supplier_ID`) ON DELETE CASCADE,
  CONSTRAINT `Products_ibfk_2` FOREIGN KEY (`category_ID`) REFERENCES `Product_Types` (`category_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Products`
--

LOCK TABLES `Products` WRITE;
/*!40000 ALTER TABLE `Products` DISABLE KEYS */;
INSERT INTO `Products` VALUES (1,'Apple Juice',40,3.99,1,1),(2,'Potato Chips',50,5.99,4,2),(3,'Milk',25,4.25,3,3),(4,'Bread',40,2.99,1,4),(5,'Soda',50,4.99,2,1);
/*!40000 ALTER TABLE `Products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Suppliers`
--

DROP TABLE IF EXISTS `Suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Suppliers` (
  `supplier_ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  PRIMARY KEY (`supplier_ID`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Suppliers`
--

LOCK TABLES `Suppliers` WRITE;
/*!40000 ALTER TABLE `Suppliers` DISABLE KEYS */;
INSERT INTO `Suppliers` VALUES (1,'Fresh Foods Inc.','sales@freshfoods.com'),(2,'Great Beverage Inc.','contact@greatbeverage.com'),(3,'Double Dairy','orders@doubledairy.com'),(4,'Infinity Snacks','info@infinitysnacks.com');
/*!40000 ALTER TABLE `Suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TermsCode`
--

DROP TABLE IF EXISTS `TermsCode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `TermsCode` (
  `TermsCodeID` varchar(50) NOT NULL,
  `Description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`TermsCodeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TermsCode`
--

LOCK TABLES `TermsCode` WRITE;
/*!40000 ALTER TABLE `TermsCode` DISABLE KEYS */;
INSERT INTO `TermsCode` VALUES ('210NET30','2% discount in 10 days Net 30'),('NET15','Payment due in 15 days.'),('NET30','Payment due in 30 days.');
/*!40000 ALTER TABLE `TermsCode` ENABLE KEYS */;
UNLOCK TABLES;