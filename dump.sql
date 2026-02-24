-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: jobly
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actions`
--

DROP TABLE IF EXISTS `actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `supposing` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `condition` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `time` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `actions_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actions`
--

LOCK TABLES `actions` WRITE;
/*!40000 ALTER TABLE `actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `addition_vacancy`
--

DROP TABLE IF EXISTS `addition_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addition_vacancy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vacancy_id` bigint unsigned NOT NULL,
  `addition_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `addition_vacancy_vacancy_id_foreign` (`vacancy_id`),
  KEY `addition_vacancy_addition_id_foreign` (`addition_id`),
  CONSTRAINT `addition_vacancy_addition_id_foreign` FOREIGN KEY (`addition_id`) REFERENCES `additions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addition_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addition_vacancy`
--

LOCK TABLES `addition_vacancy` WRITE;
/*!40000 ALTER TABLE `addition_vacancy` DISABLE KEYS */;
INSERT INTO `addition_vacancy` VALUES (3,1,1),(4,1,2);
/*!40000 ALTER TABLE `addition_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `additions`
--

DROP TABLE IF EXISTS `additions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `additions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `additions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `additions`
--

LOCK TABLES `additions` WRITE;
/*!40000 ALTER TABLE `additions` DISABLE KEYS */;
INSERT INTO `additions` VALUES (2,'Вакансия подходит для пенсионеров'),(8,'Вакансия подходит для соискателей от 14 лет'),(5,'Вакансия подходит для студентов'),(6,'Возможно временное оформление'),(1,'Личный автомобиль'),(7,'Можно начинать после 16:00'),(9,'Можно работать сменами'),(4,'Работа только по СБ и ВС'),(3,'Требуется загранпаспорт');
/*!40000 ALTER TABLE `additions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `division` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `count` int DEFAULT NULL,
  `salaryFrom` int DEFAULT NULL,
  `salaryTo` int DEFAULT NULL,
  `currency` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `require` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duty` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateStart` date DEFAULT NULL,
  `dateWork` date DEFAULT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `vacancy_id` bigint unsigned DEFAULT NULL,
  `status_id` bigint unsigned DEFAULT NULL,
  `client_id` bigint unsigned DEFAULT NULL,
  `executor_id` bigint unsigned DEFAULT NULL,
  `responsible_id` bigint unsigned DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `applications_customer_id_foreign` (`customer_id`),
  KEY `applications_vacancy_id_foreign` (`vacancy_id`),
  KEY `applications_status_id_foreign` (`status_id`),
  KEY `applications_client_id_foreign` (`client_id`),
  KEY `applications_executor_id_foreign` (`executor_id`),
  KEY `applications_responsible_id_foreign` (`responsible_id`),
  CONSTRAINT `applications_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_executor_id_foreign` FOREIGN KEY (`executor_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,'2025-05-23 19:37:08','2025-05-27 14:21:08','Менеджер','Продажи',3,20000,50000,'RUB','Требования','Обязанности','Причина открытия','2025-04-12','2025-04-30',28,NULL,NULL,40,39,37,NULL),(2,'2025-05-23 19:38:27','2025-05-27 07:55:09','СЕО','Продажи',3,20000,50000,'RUB','Требования','Обязанности','Причина открытия','2025-04-12','2025-04-30',28,1,1,40,NULL,35,NULL),(5,'2025-05-23 20:09:49','2025-05-29 14:29:47','Юрист','Управление',2,100000,200000,'RUB (рубль)','Внимательность к деталям, скурпулезность','Составление договоров','Расширения','2025-07-11','2025-09-12',30,NULL,3,40,39,35,'Москва, ул. дорожная д2'),(43,'2025-10-15 04:24:23','2025-11-25 16:19:53','Водитель','Аналитика',3,80000,120000,'RUB (рубль)',NULL,NULL,NULL,NULL,NULL,41,NULL,3,55,NULL,54,'Москва'),(44,'2025-10-15 05:42:51','2025-11-25 16:20:29','Повар','Аналитика',1,20000,40000,'RUB (рубль)','требования','обязанности',NULL,'2025-10-01','2025-10-01',53,59,2,55,35,54,'Москва'),(45,'2025-10-16 18:29:18','2025-11-13 19:57:35','Официант',NULL,1,20000,30000,'RUB (рубль)',NULL,NULL,NULL,NULL,NULL,55,88,2,55,NULL,54,'Москва'),(46,'2025-10-22 05:06:08','2025-10-23 18:37:34','Водитель',NULL,6,40000,80000,'RUB (рубль)',NULL,NULL,NULL,'2025-10-22','2025-10-09',55,NULL,2,NULL,NULL,54,'Москва'),(51,'2025-11-02 21:03:03','2025-11-02 23:17:52','СЕО','Продажи',3,20000,50000,'RUB','Требования','Обязанности','Причина открытия','2025-04-12','2025-04-30',41,1,2,40,NULL,35,NULL),(52,'2025-11-07 05:46:48','2025-11-07 06:14:47','Водитель',NULL,3,NULL,NULL,'RUB (рубль)',NULL,NULL,NULL,NULL,NULL,41,NULL,3,55,NULL,54,'Москва'),(59,'2025-11-20 13:27:59','2025-12-07 20:05:26','Повар',NULL,4,NULL,NULL,'RUB (рубль)',NULL,NULL,NULL,NULL,NULL,41,88,1,55,NULL,54,'Москва');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approval_application`
--

DROP TABLE IF EXISTS `approval_application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_application` (
  `application_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `executor_id` bigint unsigned NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `approval_application_application_id_foreign` (`application_id`),
  KEY `approval_application_customer_id_foreign` (`customer_id`),
  KEY `approval_application_executor_id_foreign` (`executor_id`),
  KEY `approval_application_status_id_foreign` (`status_id`),
  CONSTRAINT `approval_application_application_id_foreign` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_application_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_application_executor_id_foreign` FOREIGN KEY (`executor_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_application_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_application`
--

LOCK TABLES `approval_application` WRITE;
/*!40000 ALTER TABLE `approval_application` DISABLE KEYS */;
INSERT INTO `approval_application` VALUES (45,55,54,NULL,2,'2025-10-19 20:45:36','2025-10-19 20:45:36'),(43,41,54,'345636435645',2,'2025-10-19 21:28:29','2025-10-19 21:28:29'),(44,53,41,NULL,2,'2025-10-20 05:03:20','2025-10-20 05:03:20'),(51,41,41,NULL,2,'2025-11-02 23:17:52','2025-11-02 23:17:52'),(52,41,41,'Неверная вакансия, вам не нужны Водители',2,'2025-11-07 06:13:02','2025-11-07 06:13:02');
/*!40000 ALTER TABLE `approval_application` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachment_candidates`
--

DROP TABLE IF EXISTS `attachment_candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachment_candidates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attachment_candidates_candidate_id_foreign` (`candidate_id`),
  CONSTRAINT `attachment_candidates_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachment_candidates`
--

LOCK TABLES `attachment_candidates` WRITE;
/*!40000 ALTER TABLE `attachment_candidates` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachment_candidates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avitos`
--

DROP TABLE IF EXISTS `avitos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avitos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `expires_in` int NOT NULL,
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `avitos_customer_id_foreign` (`customer_id`),
  CONSTRAINT `avitos_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avitos`
--

LOCK TABLES `avitos` WRITE;
/*!40000 ALTER TABLE `avitos` DISABLE KEYS */;
INSERT INTO `avitos` VALUES (1,NULL,NULL,41,1770672133,'kkEW6csSRxu8D_mMmabgkQ8nxMUR2zGPVXVskNPS',NULL,'213672674');
/*!40000 ALTER TABLE `avitos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_custom_field_values`
--

DROP TABLE IF EXISTS `candidate_custom_field_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_custom_field_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `custom_field_id` bigint unsigned NOT NULL,
  `candidate_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_custom_field_values_custom_field_id_foreign` (`custom_field_id`),
  KEY `candidate_custom_field_values_candidate_id_foreign` (`candidate_id`),
  CONSTRAINT `candidate_custom_field_values_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidate_custom_field_values_custom_field_id_foreign` FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidate_custom_field_values`
--

LOCK TABLES `candidate_custom_field_values` WRITE;
/*!40000 ALTER TABLE `candidate_custom_field_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_custom_field_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_funnel_stage`
--

DROP TABLE IF EXISTS `candidate_funnel_stage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_funnel_stage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `candidate_id` bigint unsigned NOT NULL,
  `funnel_stage_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_funnel_stage_candidate_id_foreign` (`candidate_id`),
  KEY `candidate_funnel_stage_funnel_stage_id_foreign` (`funnel_stage_id`),
  CONSTRAINT `candidate_funnel_stage_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidate_funnel_stage_funnel_stage_id_foreign` FOREIGN KEY (`funnel_stage_id`) REFERENCES `funnel_stage` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidate_funnel_stage`
--

LOCK TABLES `candidate_funnel_stage` WRITE;
/*!40000 ALTER TABLE `candidate_funnel_stage` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_funnel_stage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_platform`
--

DROP TABLE IF EXISTS `candidate_platform`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_platform` (
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `candidate_id` bigint unsigned NOT NULL,
  `platform` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platform_id` int DEFAULT NULL,
  KEY `candidate_platform_candidate_id_foreign` (`candidate_id`),
  CONSTRAINT `candidate_platform_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidate_platform`
--

LOCK TABLES `candidate_platform` WRITE;
/*!40000 ALTER TABLE `candidate_platform` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_platform` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_skill`
--

DROP TABLE IF EXISTS `candidate_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_skill` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `candidate_id` bigint unsigned NOT NULL,
  `skill_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_skill_candidate_id_foreign` (`candidate_id`),
  KEY `candidate_skill_skill_id_foreign` (`skill_id`),
  CONSTRAINT `candidate_skill_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidate_skill_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidate_skill`
--

LOCK TABLES `candidate_skill` WRITE;
/*!40000 ALTER TABLE `candidate_skill` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_skill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_tag`
--

DROP TABLE IF EXISTS `candidate_tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_tag` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `candidate_id` bigint unsigned NOT NULL,
  `tag_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_tag_candidate_id_foreign` (`candidate_id`),
  KEY `candidate_tag_tag_id_foreign` (`tag_id`),
  CONSTRAINT `candidate_tag_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidate_tag_tag_id_foreign` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidate_tag`
--

LOCK TABLES `candidate_tag` WRITE;
/*!40000 ALTER TABLE `candidate_tag` DISABLE KEYS */;
INSERT INTO `candidate_tag` VALUES (1,5,2),(2,5,3),(3,5,4),(4,6,2),(5,7,2);
/*!40000 ALTER TABLE `candidate_tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_vacancy`
--

DROP TABLE IF EXISTS `candidate_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_vacancy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `candidate_id` bigint unsigned NOT NULL,
  `vacancy_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_vacancy_candidate_id_foreign` (`candidate_id`),
  KEY `candidate_vacancy_vacancy_id_foreign` (`vacancy_id`),
  CONSTRAINT `candidate_vacancy_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidate_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidate_vacancy`
--

LOCK TABLES `candidate_vacancy` WRITE;
/*!40000 ALTER TABLE `candidate_vacancy` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `firstname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `surname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patronymic` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` int DEFAULT NULL,
  `salaryFrom` int DEFAULT NULL,
  `salaryTo` int DEFAULT NULL,
  `currency` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quickInfo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `messengerMax` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skype` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagePath` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isPng` tinyint(1) DEFAULT NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resumePath` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resume` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverPath` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isReserve` tinyint(1) DEFAULT '0',
  `vacancy_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `stage_id` bigint unsigned NOT NULL,
  `manager_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `candidates_vacancy_id_foreign` (`vacancy_id`),
  KEY `candidates_customer_id_foreign` (`customer_id`),
  KEY `candidates_stage_id_foreign` (`stage_id`),
  KEY `candidates_manager_id_foreign` (`manager_id`),
  CONSTRAINT `candidates_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidates_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidates_stage_id_foreign` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidates_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates`
--

LOCK TABLES `candidates` WRITE;
/*!40000 ALTER TABLE `candidates` DISABLE KEYS */;
INSERT INTO `candidates` VALUES (3,'Игорь','Евдокимов',NULL,NULL,'+79920981729','mail@test.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Водитель',NULL,NULL,0,NULL,41,1,NULL,'2025-12-15 05:12:03','2026-01-14 04:54:26'),(4,'Сергей','Антропов',NULL,NULL,'+79992088748','serg@mail.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Менеджер по продажам',NULL,NULL,0,NULL,41,1,NULL,'2025-12-25 06:33:52','2026-01-14 05:08:12'),(5,'Дмитрий','Мельников',NULL,NULL,'+79998278394','telknb@mail.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Водитель',NULL,NULL,0,81,41,1,NULL,'2025-12-25 06:34:28','2026-01-16 05:08:07'),(6,'Игорь','Геннадьевич',NULL,NULL,'+79093748594','trkjb@mail.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Электрик',NULL,NULL,0,81,41,3,NULL,'2025-12-25 06:40:52','2026-01-16 05:07:43'),(7,'Тест','Тест',NULL,NULL,'+78736780942','kjhasdvkhj@mail.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Тест',NULL,NULL,0,65,41,3,NULL,'2025-12-25 14:38:13','2026-02-10 06:52:07'),(8,'Никита','Демьянов',NULL,NULL,'+79837469384','terkbj@mail.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Программист',NULL,NULL,0,NULL,41,1,NULL,'2025-12-26 04:33:36','2025-12-26 04:33:36'),(9,'Сергей','Зарзов',NULL,NULL,'+79873897267','lkjbkjhv@mai.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Водитель',NULL,NULL,0,NULL,41,1,NULL,'2025-12-26 04:41:08','2025-12-26 04:41:08'),(10,'Иван','Иванов',NULL,NULL,'+79876543210','test123@test.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Тестировщик',NULL,NULL,0,59,54,1,NULL,'2025-12-28 08:06:33','2025-12-28 08:07:02'),(11,'Пётр','Петров',NULL,NULL,'+78974563212','test543@test.ru',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Вакантное',NULL,NULL,0,59,54,1,NULL,'2025-12-29 05:00:43','2025-12-29 05:00:43');
/*!40000 ALTER TABLE `candidates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_vacancy`
--

DROP TABLE IF EXISTS `client_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_vacancy` (
  `customer_id` bigint unsigned NOT NULL,
  `vacancy_id` bigint unsigned NOT NULL,
  KEY `client_vacancy_customer_id_foreign` (`customer_id`),
  KEY `client_vacancy_vacancy_id_foreign` (`vacancy_id`),
  CONSTRAINT `client_vacancy_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_vacancy`
--

LOCK TABLES `client_vacancy` WRITE;
/*!40000 ALTER TABLE `client_vacancy` DISABLE KEYS */;
INSERT INTO `client_vacancy` VALUES (55,59);
/*!40000 ALTER TABLE `client_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `condition_vacancy`
--

DROP TABLE IF EXISTS `condition_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `condition_vacancy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `condition_id` bigint unsigned NOT NULL,
  `vacancy_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `condition_vacancy_condition_id_foreign` (`condition_id`),
  KEY `condition_vacancy_vacancy_id_foreign` (`vacancy_id`),
  CONSTRAINT `condition_vacancy_condition_id_foreign` FOREIGN KEY (`condition_id`) REFERENCES `conditions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `condition_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `condition_vacancy`
--

LOCK TABLES `condition_vacancy` WRITE;
/*!40000 ALTER TABLE `condition_vacancy` DISABLE KEYS */;
/*!40000 ALTER TABLE `condition_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conditions`
--

DROP TABLE IF EXISTS `conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conditions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conditions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conditions`
--

LOCK TABLES `conditions` WRITE;
/*!40000 ALTER TABLE `conditions` DISABLE KEYS */;
INSERT INTO `conditions` VALUES (9,'Без оформления по ТК'),(1,'ДМС'),(6,'Командировки'),(2,'Мобильная связь'),(4,'Питание'),(8,'Помощь с переездом, проживание'),(7,'Служебный автомобиль'),(5,'Спецодежда'),(3,'Фитнес');
/*!40000 ALTER TABLE `conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coordinating_vacancy`
--

DROP TABLE IF EXISTS `coordinating_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coordinating_vacancy` (
  `customer_id` bigint unsigned NOT NULL,
  `vacancy_id` bigint unsigned NOT NULL,
  KEY `coordinating_vacancy_customer_id_foreign` (`customer_id`),
  KEY `coordinating_vacancy_vacancy_id_foreign` (`vacancy_id`),
  CONSTRAINT `coordinating_vacancy_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coordinating_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coordinating_vacancy`
--

LOCK TABLES `coordinating_vacancy` WRITE;
/*!40000 ALTER TABLE `coordinating_vacancy` DISABLE KEYS */;
INSERT INTO `coordinating_vacancy` VALUES (35,59),(53,59);
/*!40000 ALTER TABLE `coordinating_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currencies_name_unique` (`name`),
  UNIQUE KEY `currencies_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES (1,'рубль','RUB'),(2,'доллар','USD'),(3,'евро','EUR'),(4,'тенге','KZT');
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_field_types`
--

DROP TABLE IF EXISTS `custom_field_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_field_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `multiply` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_field_types`
--

LOCK TABLES `custom_field_types` WRITE;
/*!40000 ALTER TABLE `custom_field_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_field_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_fields`
--

DROP TABLE IF EXISTS `custom_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_id` bigint unsigned NOT NULL,
  `require` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `custom_fields_type_id_foreign` (`type_id`),
  CONSTRAINT `custom_fields_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `custom_field_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_fields`
--

LOCK TABLES `custom_fields` WRITE;
/*!40000 ALTER TABLE `custom_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_department`
--

DROP TABLE IF EXISTS `customer_department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_department` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_department_customer_id_foreign` (`customer_id`),
  KEY `customer_department_department_id_foreign` (`department_id`),
  CONSTRAINT `customer_department_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_department_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_department`
--

LOCK TABLES `customer_department` WRITE;
/*!40000 ALTER TABLE `customer_department` DISABLE KEYS */;
INSERT INTO `customer_department` VALUES (1,1,41);
/*!40000 ALTER TABLE `customer_department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_funnel`
--

DROP TABLE IF EXISTS `customer_funnel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_funnel` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `funnel_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_funnel_funnel_id_foreign` (`funnel_id`),
  KEY `customer_funnel_customer_id_foreign` (`customer_id`),
  CONSTRAINT `customer_funnel_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_funnel_funnel_id_foreign` FOREIGN KEY (`funnel_id`) REFERENCES `funnels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_funnel`
--

LOCK TABLES `customer_funnel` WRITE;
/*!40000 ALTER TABLE `customer_funnel` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_funnel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_relations`
--

DROP TABLE IF EXISTS `customer_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_relations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  PRIMARY KEY (`id`),
  KEY `customer_relations_user_id_foreign` (`user_id`),
  KEY `customer_relations_customer_id_foreign` (`customer_id`),
  CONSTRAINT `customer_relations_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_relations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_relations`
--

LOCK TABLES `customer_relations` WRITE;
/*!40000 ALTER TABLE `customer_relations` DISABLE KEYS */;
INSERT INTO `customer_relations` VALUES (1,41,35,'active'),(2,41,44,'new'),(11,41,53,'new'),(12,41,54,'active'),(13,41,55,'active'),(15,41,57,'new'),(41,41,83,'new');
/*!40000 ALTER TABLE `customer_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` bigint unsigned NOT NULL DEFAULT '1',
  `auth_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auth_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_login_unique` (`login`),
  UNIQUE KEY `customers_password_unique` (`password`),
  UNIQUE KEY `customers_phone_unique` (`phone`),
  KEY `customers_role_id_foreign` (`role_id`),
  CONSTRAINT `customers_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (27,'2025-04-02 07:05:09','2025-04-02 07:10:12','Тест Регистрации0','testreg0@mail.ru','testreg0@mail.ru','$2y$12$/wYbtxO5ntt0bL15omlT8eX/R9LwyAaTPe126.o73y0AuSLIelEva','+71234654698',NULL,'Рекомендация',1,'$2y$12$PnEK7MzrzNA7axNlsOmiI.vwLL3OqziFqVdhobFGlTPujbFA9YptS','2025-06-02 07:10:12'),(28,'2025-04-08 10:04:18','2025-08-24 19:23:31','Роман Немерцев','nemercevroman@gmail.com','nemercevroman@gmail.com','$2y$12$W7Bn4hjNfC4a4FCwh25bEeqcu2jgz9qe/qv7Ryco.aYCH2tWMFWo.','+79064123036',NULL,'Рекламная кампания (звонок, смс)',1,'$2y$12$YOuV3KCCFO50aGzb1h0Vne2FrpE1D5CvJ/Zs9F59kgAdepCsPnqai','2025-10-24 19:23:31'),(29,'2025-04-14 04:59:09','2025-04-14 04:59:09','Игорь','test355@mail.ru','test355@mail.ru','$2y$12$ak.JqpnMr2LOg..QMkOUwOati6tk5ERKoPW2fNHTyHUA8MPPDIijO','+79992083284',NULL,NULL,1,NULL,NULL),(30,'2025-04-14 05:00:20','2025-09-08 05:01:56','Игорь','igor_wow_07@mail.ru','igor_wow_07@mail.ru','$2y$12$KRcsZnEcX3cJczgceCW62utvnq/XbahduAHfvxoGcvITO93CAu.WK','+79997862397',NULL,NULL,1,'$2y$12$2QFvgFPPdOqTuKS2hQh6LeN4MB.nae2XuhMCxJaaAEzPNglXKohFW','2025-11-08 05:01:56'),(31,'2025-04-17 13:51:00','2026-01-21 12:49:25','Мельников Дмитрий','dmitrymelnikov128@gmail.com','dmitrymelnikov128@gmail.com','$2y$12$b7GwvpdnV1858GJwpqHsv.jJvi/9xAS.NWKg0MDl8U.7LsKxDod12','+79133214745','vk.com','Социальные сети',1,'$2y$12$u7Mv2dXZknyETUJZfVnB3eZVZtEYRRDY53VfRMQn4ELMHv8hHnacm','2026-03-21 12:49:25'),(35,'2025-05-12 10:31:03','2025-05-12 10:31:03','Лариса Ивановна','larisa@mail.ru','larisa@mail.ru','$2a$12$mHIZ1UoVZ/uFzYZcZ1wCZu34OgcXnUhzhXTglvkWSiPqWPMoC2Zg2','+79204534522','test.ru',NULL,3,'$2a$12$QEz5elnW8kkRlnRKvvohGOg7RIK.kgtS4SWxSjWitoLuAp79tqKWu','2025-08-28 18:51:27'),(37,'2025-05-12 10:40:05','2025-05-12 10:40:05','Кирилл Петрович','kirill-test-manager@mail.ru','kirill-manager','1020304050607809','+79205463453799',NULL,NULL,4,NULL,NULL),(39,NULL,NULL,'Кристина Эдуардовна','krisitna-test-manager@mail.ru','kristina-manager','10203040506070801','+7920345339786',NULL,NULL,4,NULL,NULL),(40,NULL,NULL,'Сергей Викторович','sergey@mail.ru','sergey@mail.ru','10203040565566','+79204568883499',NULL,NULL,5,NULL,NULL),(41,'2025-05-23 08:35:50','2026-02-16 09:32:27','Alesia Bezrukova','gravielladesign@gmail.com','gravielladesign@gmail.com','$2y$12$sVhSweJ1vRofEFUPJWJ0Z.0oa8K/ah2VtG4v.R45Cw594fzzISOxG','+71111111111','https://test-dev.ru','Рекомендация',1,'$2y$12$5xtM4pILQeWVm1yoc1P0fev97N95LBKf2Ck/1uQgsu3JMniuQSLuC','2026-04-16 09:32:27'),(42,'2025-06-27 08:05:12','2025-06-27 08:05:12','ТЕСТ','testovivan@gmail.com','testovivan@gmail.com','$2y$12$W93U32AV0BzwxO.YIoTN4eJUzZeyRyi20hm16l./wpzqQGzQ2u8Dq','+79993223333','test','Социальные сети',1,NULL,NULL),(43,'2025-07-03 08:14:33','2025-07-03 08:14:49','Alexey Savinkov','naton.kreas@mail.ru','naton.kreas@mail.ru','$2y$12$v9lzl7oL113pCZNJDEBteOl8ufscXOZ34Vi75CnnZKJtE7cDPr1cy','+79234381369',NULL,'Рекомендация',1,'$2y$12$yjP6izjDGETJXWFSNhy.Ke/BC1zpcOISotNTS3mqbPwMAYFMntwRq','2025-09-03 08:14:49'),(44,'2025-10-02 22:36:52','2025-10-02 23:00:32','Анатолий Иванович','batyapayalnik@gmail.com ','batyapayalnik@gmail.com','$2y$12$5aHt/a.srEhCiUOZQBxK9uokWy6sb9/MbV1Vt0wVL8wFf9z7Fum.a',NULL,'https://job-ly.ru','По приглашению из платформы',5,'$2y$12$cH9IcAHTOymPAi/nuLzI7.P4Rm1LuuY9K2ie6B0SkE0UbGhGk0.56','2025-12-02 22:39:06'),(53,'2025-10-05 16:48:02','2025-10-15 05:41:07','test test','graviella@mail.ru','graviella@mail.ru','$2y$12$0iaUYnlRgyc3diyWONDej.IZ5qNCjQE1qK9TlL3B6PN8x1mR8XgoK',NULL,'https://job-ly.ru','По приглашению из платформы',5,'$2y$12$K6fp1OBvZIyq0WO/9Jul..OqAYZPtPf9i5AKOOTQBMb6nqjCU.RpW','2025-12-15 05:41:07'),(54,'2025-10-07 14:10:27','2025-12-28 08:05:42','Игорь Евдокимов Андреевич','i79992083231@yandex.ru','i79992083231@yandex.ru','$2y$12$X7tgwQ8QlC8zHKe32pIXbeaiQ/U6C.jEkHaZdl5sEMTjHeLCzkdfO',NULL,'https://job-ly.ru','По приглашению из платформы',3,'$2y$12$lqBG.8u3l.L/4RPnijr1PuX3j9tnympCad9303TasGXNmHWVxvCUK','2026-02-28 08:05:42'),(55,'2025-10-07 14:10:42','2025-12-04 20:47:43','Денис Евдокимов Андреевич','i79992083231@gmail.com','i79992083231@gmail.com','$2y$12$K9zE1tIxvk.IUTruK.UnU.m8Ty0UUT3qSTwq9WI6sGqq7VjVKoUBC',NULL,'https://job-ly.ru','По приглашению из платформы',5,'$2y$12$/sUwLKXJdT9FifQvokCAeuRWCj03uxxp2CuYHywApAG3vu4EV9LpC','2026-02-04 20:47:43'),(57,'2025-10-15 05:37:45','2025-10-15 05:39:19','Мария Фомина Степновна','mari-fomina@mail.ru','mari-fomina','$2y$12$3bYLqq2BX2phZXHZRJJepOVE2IbCbaQ6UrpXJBAO5j7mbr9UHQrGq',NULL,'https://job-ly.ru','По приглашению из платформы',5,'$2y$12$6AdvewQlcxkpbQv2ytvNmee7jWB524v/G3vr6YQGQt89bGrAuMIbS','2025-12-15 05:39:19'),(83,'2025-10-26 22:11:51','2025-10-26 22:11:51','Test testovich','test@mail.ru','test@mail.ru','$2y$12$k3lovxHEwtkImq2OKTBMFOWjyGCgfSXbF8qiUMtlXHKaJnT9SNm/a',NULL,'https://job-ly.ru','По приглашению из платформы',5,NULL,NULL),(84,'2025-11-23 07:23:26','2025-11-23 07:23:26','Андрей','kaylang@mail.ru','kaylang@mail.ru','$2y$12$rZS/G0t..gx2sJ0X7Ec3re8sixduZySGDn3YrR3zQ7gnGXs9IgKo.','+79290086279',NULL,NULL,1,NULL,NULL),(85,'2025-11-29 11:08:17','2025-11-29 11:38:16','Andrey Kulyatin','andrei.kouliatine@gmail.com','andrei.kouliatine@gmail.com','$2y$12$s41xo5AaxVh2H4pqp8ZtnOKitW7ryCk8nCvSv..vwUZfGEsNuYF9W','+77771111111',NULL,'Рекомендация',1,'$2y$12$hD8ivPSBFfI88.zWperTIOdzuMHDawkPn/oFyMbZomSl7PIcjCQY6','2026-01-29 11:38:16'),(112,'2026-01-20 21:08:35','2026-01-20 21:08:35','Test','somedaysomeday@yandex.ru','somedaysomeday@yandex.ru','$2y$12$oPkOnBPZGlMa3im6TGqUduX1CbYxpM24CGH5oy6dd1ZqXsceIw9bC','+79059664311','Jus','Рекомендация',1,NULL,NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_division`
--

DROP TABLE IF EXISTS `department_division`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_division` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint unsigned NOT NULL,
  `division` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `department_division_department_id_foreign` (`department_id`),
  CONSTRAINT `department_division_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_division`
--

LOCK TABLES `department_division` WRITE;
/*!40000 ALTER TABLE `department_division` DISABLE KEYS */;
INSERT INTO `department_division` VALUES (1,1,'SEO'),(2,1,'Программирование');
/*!40000 ALTER TABLE `department_division` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Разработка','2025-09-28 20:44:06','2025-09-28 20:44:06');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_vacancy`
--

DROP TABLE IF EXISTS `driver_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_vacancy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vacancy_id` bigint unsigned NOT NULL,
  `driver_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_vacancy_vacancy_id_foreign` (`vacancy_id`),
  KEY `driver_vacancy_driver_id_foreign` (`driver_id`),
  CONSTRAINT `driver_vacancy_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_vacancy`
--

LOCK TABLES `driver_vacancy` WRITE;
/*!40000 ALTER TABLE `driver_vacancy` DISABLE KEYS */;
INSERT INTO `driver_vacancy` VALUES (34,1,1),(35,1,2),(40,111,2),(81,112,2);
/*!40000 ALTER TABLE `driver_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `drivers_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES (1,'A'),(2,'B'),(7,'BE'),(3,'C'),(10,'CE'),(4,'D'),(9,'DE'),(5,'E'),(6,'M'),(8,'TB');
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `education`
--

DROP TABLE IF EXISTS `education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `educations_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `education`
--

LOCK TABLES `education` WRITE;
/*!40000 ALTER TABLE `education` DISABLE KEYS */;
INSERT INTO `education` VALUES (2,'Высшее'),(1,'Не имеет значения'),(3,'Неполное высшее'),(6,'Неполное среднее'),(5,'Среднее'),(4,'Среднее специальное');
/*!40000 ALTER TABLE `education` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employments`
--

DROP TABLE IF EXISTS `employments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employments`
--

LOCK TABLES `employments` WRITE;
/*!40000 ALTER TABLE `employments` DISABLE KEYS */;
INSERT INTO `employments` VALUES (1,'Полная'),(2,'Частичная'),(3,'Временная'),(4,'Стажировка');
/*!40000 ALTER TABLE `employments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `candidate_id` bigint unsigned NOT NULL,
  `vacancy_id` bigint unsigned DEFAULT NULL,
  `type` enum('system','note','call','task','email','chat','comment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `occurred_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `author_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direction` enum('incoming','outgoing') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `events_candidate_vacancy_time` (`candidate_id`,`vacancy_id`,`occurred_at`),
  KEY `events_candidate_time` (`candidate_id`,`occurred_at`),
  KEY `events_vacancy_id_foreign` (`vacancy_id`),
  KEY `events_candidate_vacancy_time_desc` (`candidate_id`,`vacancy_id`,`occurred_at` DESC),
  KEY `events_candidate_time_desc` (`candidate_id`,`occurred_at` DESC),
  CONSTRAINT `events_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `events_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,7,65,'system','2026-01-26 04:58:05','2026-01-26 04:58:05','2026-01-26 04:58:05','Alesia Bezrukova',NULL,NULL),(2,7,65,'system','2026-02-10 06:52:07','2026-02-10 06:52:07','2026-02-10 06:52:07','Alesia Bezrukova',NULL,NULL);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_chats`
--

DROP TABLE IF EXISTS `events_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events_chats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `provider` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('incoming','outgoing') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','sent','failed','delivered','read') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_message_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_chat_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sync_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_chats_event_id_unique` (`event_id`),
  UNIQUE KEY `chats_provider_external_id` (`provider`,`external_message_id`),
  KEY `chats_provider_chat_id` (`provider`,`external_chat_id`),
  CONSTRAINT `events_chats_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_chats`
--

LOCK TABLES `events_chats` WRITE;
/*!40000 ALTER TABLE `events_chats` DISABLE KEYS */;
/*!40000 ALTER TABLE `events_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_system`
--

DROP TABLE IF EXISTS `events_system`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events_system` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_system_event_id_unique` (`event_id`),
  CONSTRAINT `events_system_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_system`
--

LOCK TABLES `events_system` WRITE;
/*!40000 ALTER TABLE `events_system` DISABLE KEYS */;
INSERT INTO `events_system` VALUES (1,1,'Alesia Bezrukova: Новый этап: Подумать из Не разобранное','2026-01-26 04:58:05'),(2,2,'Alesia Bezrukova: Новый этап: Подходящие из Подумать','2026-02-10 06:52:07');
/*!40000 ALTER TABLE `events_system` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `executors`
--

DROP TABLE IF EXISTS `executors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `executors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `executors`
--

LOCK TABLES `executors` WRITE;
/*!40000 ALTER TABLE `executors` DISABLE KEYS */;
/*!40000 ALTER TABLE `executors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `experiences`
--

DROP TABLE IF EXISTS `experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experiences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `experiences_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `experiences`
--

LOCK TABLES `experiences` WRITE;
/*!40000 ALTER TABLE `experiences` DISABLE KEYS */;
INSERT INTO `experiences` VALUES (1,'Не имеет значения'),(2,'От 1 до 3 лет'),(3,'От 3 до 6 лет'),(4,'От 6 лет');
/*!40000 ALTER TABLE `experiences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funnel_stage`
--

DROP TABLE IF EXISTS `funnel_stage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funnel_stage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `funnel_id` bigint unsigned NOT NULL,
  `stage_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `funnel_stage_customer_id_foreign` (`customer_id`),
  KEY `funnel_stage_funnel_id_foreign` (`funnel_id`),
  KEY `funnel_stage_stage_id_foreign` (`stage_id`),
  CONSTRAINT `funnel_stage_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `funnel_stage_funnel_id_foreign` FOREIGN KEY (`funnel_id`) REFERENCES `funnels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `funnel_stage_stage_id_foreign` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funnel_stage`
--

LOCK TABLES `funnel_stage` WRITE;
/*!40000 ALTER TABLE `funnel_stage` DISABLE KEYS */;
/*!40000 ALTER TABLE `funnel_stage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funnels`
--

DROP TABLE IF EXISTS `funnels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `funnels_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funnels`
--

LOCK TABLES `funnels` WRITE;
/*!40000 ALTER TABLE `funnels` DISABLE KEYS */;
INSERT INTO `funnels` VALUES (1,'Воронка найма');
/*!40000 ALTER TABLE `funnels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `head_hunters`
--

DROP TABLE IF EXISTS `head_hunters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `head_hunters` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `expires_in` int NOT NULL,
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employer_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `head_hunter_customer_id_foreign` (`customer_id`),
  CONSTRAINT `head_hunter_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `head_hunters`
--

LOCK TABLES `head_hunters` WRITE;
/*!40000 ALTER TABLE `head_hunters` DISABLE KEYS */;
INSERT INTO `head_hunters` VALUES (9,'2026-01-25 05:51:51','2026-02-08 12:14:12',41,1771762451,'USERQ1IDHFCD07D04E920F40DOALUM3UO6DSL4K0V440CGOHI29DKB9LG7FBE046','USERRTNCLB1NI97A8BP2AEDL721IBBHLI5060DC3QJAISOECTVS08KPNPPRH2Q5S','11211100');
/*!40000 ALTER TABLE `head_hunters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `industries`
--

DROP TABLE IF EXISTS `industries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `industries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `industries_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `industries`
--

LOCK TABLES `industries` WRITE;
/*!40000 ALTER TABLE `industries` DISABLE KEYS */;
INSERT INTO `industries` VALUES (9,'Жилищное хозяйство и бытовое обслуживание'),(4,'Здравоохранение'),(5,'Культура и искусство'),(8,'Наука'),(6,'Образование'),(1,'Промышленность'),(2,'Сельское хозяйство'),(3,'Строительство'),(7,'Торговля и общественное питание'),(10,'Управление');
/*!40000 ALTER TABLE `industries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_levels`
--

DROP TABLE IF EXISTS `language_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_levels` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_levels`
--

LOCK TABLES `language_levels` WRITE;
/*!40000 ALTER TABLE `language_levels` DISABLE KEYS */;
INSERT INTO `language_levels` VALUES ('a1','A1 — Начальный'),('a2','A2 — Элементарный'),('b1','B1 — Средний'),('b2','B2 — Средне-продвинутый'),('c1','C1 — Продвинутый'),('c2','C2 — В совершенстве'),('l1','Родной');
/*!40000 ALTER TABLE `language_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES ('abk','Абхазский',0),('abq','Абазинский',0),('afr','Африкаанс',0),('amh','Амхарский',0),('ara','Арабский',0),('ava','Аварский',0),('aze','Азербайджанский',0),('bak','Башкирский',0),('bel','Белорусский',0),('ben','Бенгальский',0),('bod','Тибетский',0),('bos','Боснийский',0),('bua','Бурятский',0),('bul','Болгарский',0),('cat','Каталанский',0),('ces','Чешский',0),('che','Чеченский',0),('chi','Китайский',0),('chm','Марийский',0),('chv','Чувашский',0),('crs','Креольский (Сейшельские острова)',0),('dag','Дагестанский',0),('dan','Датский',0),('dar','Даргинский',0),('deu','Немецкий',1),('ell','Греческий',0),('eng','Английский',1),('epo','Эсперанто',0),('est','Эстонский',0),('eus','Баскский',0),('fas','Персидский',0),('fin','Финский',0),('fra','Французский',1),('gle','Ирландский',0),('heb','Иврит',0),('hin','Хинди',0),('hrv','Хорватский',0),('hun','Венгерский',0),('hye','Армянский',0),('ind','Индонезийский',0),('inh','Ингушский',0),('isl','Исландский',0),('ita','Итальянский',0),('jpn','Японский',0),('kas','Кашмирский',0),('kat','Грузинский',0),('kaz','Казахский',0),('kbd','Кабардино-черкесский',0),('khm','Кхмерский (Камбоджийский)',0),('kir','Кыргызский',0),('kom','Коми',0),('kor','Корейский',0),('krc','Карачаево-балкарский',0),('krl','Карельский',0),('kum','Кумыкский',0),('kur','Курдский',0),('lao','Лаосский',0),('lat','Латинский',0),('lav','Латышский',0),('lbe','Лакский',0),('lez','Лезгинский',0),('lit','Литовский',0),('mke','Македонский',0),('mns','Мансийский',0),('mon','Монгольский',0),('mya','Бирманский',0),('nep','Непальский',0),('nld','Голландский',0),('nog','Ногайский',0),('nor','Норвежский',0),('oss','Осетинский',0),('pan','Панджаби',0),('pol','Польский',0),('por','Португальский',0),('pus','Пушту',0),('ron','Румынский',0),('rus','Русский',1),('sah','Якутский',0),('san','Санскрит',0),('slk','Словацкий',0),('slv','Словенский',0),('som','Сомалийский',0),('spa','Испанский',0),('sqi','Албанский',0),('srp','Сербский',0),('swa','Суахили',0),('swe','Шведский',0),('tam','Тамильский',0),('tat','Татарский',0),('tgk','Таджикский',0),('tgl','Тагальский',0),('tha','Тайский',0),('tly','Талышский',0),('tuk','Туркменский',0),('tur','Турецкий',0),('tyv','Тувинский',0),('udm','Удмуртский',0),('uig','Уйгурский',0),('ukr','Украинский',0),('urd','Урду',0),('uzb','Узбекский',0),('vie','Вьетнамский',0),('vls','Фламандский',0),('zho','Китайский',0),('zlm','Малазийский',0);
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (58,'0001_01_01_000000_create_users_table',1),(59,'0001_01_01_000001_create_cache_table',1),(60,'0001_01_01_000002_create_jobs_table',1),(62,'2025_02_17_193029_create_statuses_table',1),(63,'2025_02_17_193240_create_clients_table',1),(64,'2025_02_17_194129_create_executors_table',1),(67,'2025_02_19_192307_create_industries_table',2),(68,'2025_02_19_193520_create_specializations_table',3),(69,'2025_02_19_194250_create_conditions_table',4),(70,'2025_02_19_200124_create_employments_table',5),(71,'2025_02_19_201033_create_schedules_table',6),(73,'2025_02_19_203016_create_experiences_table',7),(74,'2025_02_19_204139_create_educations_table',8),(76,'2025_02_19_204854_create_currencies_table',9),(77,'2025_02_19_205918_create_places_table',10),(79,'2025_02_20_213017_create_drivers_table',11),(92,'2025_02_23_224532_create_roles_table',13),(99,'2025_02_23_224713_create_customers_table',14),(100,'2025_02_23_210041_create_vacancies_custom_table',15),(105,'2025_03_01_203917_create_funnels_table',17),(109,'2025_03_05_194255_create_stages_table',19),(113,'2025_02_23_204038_create_condition_vacancy_table',20),(114,'2025_02_23_211612_create_driver_vacancy_table',20),(115,'2025_02_23_200435_create_additions_table',21),(116,'2025_02_23_200443_create_additionals_vacancies_table',21),(118,'2025_03_12_191020_create_actions_table',22),(120,'2025_03_22_121426_create_tags_table',22),(121,'2025_03_22_123757_create_skills_table',22),(123,'2025_03_22_131003_create_custom_field_types_table',22),(124,'2025_03_22_151228_create_custom_fields_table',22),(130,'2025_04_25_141421_create_permissions_table',23),(131,'2025_04_25_141853_create_permission_role_table',23),(133,'2025_02_23_200440_create_vacancies_table',25),(134,'2025_05_12_222812_create_task_types_table',25),(136,'2025_05_15_105155_create_customer_funnel_table',26),(137,'2025_02_24_194848_create_applications_table',27),(139,'2025_03_05_194729_create_funnels_stages_table',29),(140,'2025_06_07_121244_create_phrases_table',30),(141,'2025_06_07_121631_create_phrase_vacancy_table',30),(142,'2025_06_20_000921_create_head_hunter_table',31),(146,'2025_09_21_144443_create_customer_relations_table',33),(148,'2025_09_23_204700_create_departments_table',34),(152,'2025_09_23_202627_create_approval_application_table',35),(153,'2025_11_30_141100_create_avitos_table',36),(154,'2025_09_28_143945_create_department_division_table',37),(155,'2025_12_01_015906_create_customer_department_table',37),(157,'2025_03_20_203227_create_candidates_table',38),(158,'2025_03_22_130101_create_attachment_candidate_table',38),(159,'2025_03_22_175453_create_candidate_custom_field_table',38),(160,'2025_03_30_152101_create_candidates_funnel_stages_table',38),(161,'2025_03_30_161946_create_candidate_vacancy_table',38),(162,'2025_04_01_194257_create_candidate_skill_table',38),(163,'2025_04_01_204358_create_candidate_tag_table',38),(164,'2025_05_12_231709_create_tasks_table',38),(165,'2025_09_14_114240_create_candidate_platform_table',38),(166,'2025_12_01_000000_add_source_to_candidates_table',38),(167,'2025_12_13_235714_cretate_client_vacancy_table',39),(168,'2025_12_14_001130_create_coordinating_vacancy_table',39),(169,'   2025_02_24_200441_create_condition_vacancy_table',40),(170,'2025_12_25_235500_create_platform_table',41),(171,'2025_12_24_235555_create_vacancy_platform_table',42),(172,'2025_02_24_193240_create_clients_table',43),(173,'2025_02_24_200440_create_vacancies_table',44),(174,'2025_02_24_200441_create_condition_vacancy_table',45),(175,'2025_02_25_200443_create_additionals_vacancies_table',46),(176,'2026_01_19_003821_add_vacancy_platform_id_to_vacancy_platform',47),(177,'2026_01_21_112238_create_events_table',48),(178,'2026_01_21_112301_create_events_system_table',48),(179,'2026_01_21_112310_create_events_chats_table',48),(180,'2026_01_24_230959_create_rabota_rus_table',48),(181,'2026_02_13_180000_fix_customer_department_department_id_foreign',49),(182,'2025_02_23_200400_create_roles_table',50),(183,'2026_02_16_120000_create_professional_role_tables',51),(184,'2025_02_23_200408_create_customers_table',52),(185,'2025_12_24_235550_create_platform_table',53),(186,'2026_02_16_180000_add_department_to_vacancies_table',54),(187,'2026_02_16_200000_add_place_ids_to_vacancies_table',55),(188,'2026_02_16_122728_create_languages_tables',56),(189,'2026_02_16_140000_add_vacancy_form_fields_to_vacancies_table',57);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_role`
--

DROP TABLE IF EXISTS `permission_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `value` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permission_role_permission_id_foreign` (`permission_id`),
  KEY `permission_role_role_id_foreign` (`role_id`),
  CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_role`
--

LOCK TABLES `permission_role` WRITE;
/*!40000 ALTER TABLE `permission_role` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'Просматривать все вакансии'),(2,'Управлять вакансиями'),(3,'Удалять вакансии'),(4,'Назначать ответственных на вакансии'),(5,'Приглашать и назначать заказчиков'),(6,'Удалять кандидатов'),(7,'Управлять общими шаблонами писем'),(8,'Управлять тегами'),(9,'Получать заявки на вакансии');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phrase_vacancy`
--

DROP TABLE IF EXISTS `phrase_vacancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phrase_vacancy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phrase_id` bigint unsigned NOT NULL,
  `vacancy_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `phrase_vacancy_phrase_id_foreign` (`phrase_id`),
  KEY `phrase_vacancy_vacancy_id_foreign` (`vacancy_id`),
  CONSTRAINT `phrase_vacancy_phrase_id_foreign` FOREIGN KEY (`phrase_id`) REFERENCES `phrases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phrase_vacancy_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phrase_vacancy`
--

LOCK TABLES `phrase_vacancy` WRITE;
/*!40000 ALTER TABLE `phrase_vacancy` DISABLE KEYS */;
INSERT INTO `phrase_vacancy` VALUES (31,1,111),(32,2,111),(35,1,112),(36,2,112),(37,8,112);
/*!40000 ALTER TABLE `phrase_vacancy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phrases`
--

DROP TABLE IF EXISTS `phrases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phrases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phrases`
--

LOCK TABLES `phrases` WRITE;
/*!40000 ALTER TABLE `phrases` DISABLE KEYS */;
INSERT INTO `phrases` VALUES (1,'Дизайн'),(2,'Аналитика'),(3,'Разработка'),(4,'Тестирование'),(5,'Продажи'),(6,'Маркетинг'),(7,'Тестовая вакансия'),(8,'курьер');
/*!40000 ALTER TABLE `phrases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `places`
--

DROP TABLE IF EXISTS `places`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `places` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `places_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `places`
--

LOCK TABLES `places` WRITE;
/*!40000 ALTER TABLE `places` DISABLE KEYS */;
INSERT INTO `places` VALUES (1,'Офис','Сотрудники работают в офисе'),(2,'Гибрид','Сотрудники работают как в офисе, так и дома'),(3,'Удаленно','Работники работают из дома');
/*!40000 ALTER TABLE `places` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platforms`
--

DROP TABLE IF EXISTS `platforms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platforms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platforms`
--

LOCK TABLES `platforms` WRITE;
/*!40000 ALTER TABLE `platforms` DISABLE KEYS */;
INSERT INTO `platforms` VALUES (1,'2026-01-18 23:42:41','2026-01-18 23:42:41','hh.ru'),(2,'2026-01-18 23:44:18','2026-01-18 23:44:18','avito.ru'),(3,'2026-02-08 16:20:06','2026-02-08 16:20:06','rabota.ru');
/*!40000 ALTER TABLE `platforms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professional_role_categories`
--

DROP TABLE IF EXISTS `professional_role_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professional_role_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hh_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `professional_role_categories_hh_id_unique` (`hh_id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professional_role_categories`
--

LOCK TABLES `professional_role_categories` WRITE;
/*!40000 ALTER TABLE `professional_role_categories` DISABLE KEYS */;
INSERT INTO `professional_role_categories` VALUES (28,'19','Автомобильный бизнес','2026-02-16 08:30:20','2026-02-16 08:30:20'),(29,'5','Административный персонал','2026-02-16 08:30:20','2026-02-16 08:30:20'),(30,'15','Безопасность','2026-02-16 08:30:20','2026-02-16 08:30:20'),(31,'26','Высший и средний менеджмент','2026-02-16 08:30:20','2026-02-16 08:30:20'),(32,'8','Добыча сырья','2026-02-16 08:30:20','2026-02-16 08:30:20'),(33,'16','Домашний, обслуживающий персонал','2026-02-16 08:30:20','2026-02-16 08:30:20'),(34,'14','Закупки','2026-02-16 08:30:20','2026-02-16 08:30:20'),(35,'11','Информационные технологии','2026-02-16 08:30:20','2026-02-16 08:30:20'),(36,'24','Искусство, развлечения, массмедиа','2026-02-16 08:30:20','2026-02-16 08:30:20'),(37,'6','Маркетинг, реклама, PR','2026-02-16 08:30:20','2026-02-16 08:30:20'),(38,'23','Медицина, фармацевтика','2026-02-16 08:30:20','2026-02-16 08:30:20'),(39,'25','Наука, образование','2026-02-16 08:30:20','2026-02-16 08:30:20'),(40,'1','Продажи, обслуживание клиентов','2026-02-16 08:30:20','2026-02-16 08:30:20'),(41,'7','Производство, сервисное обслуживание','2026-02-16 08:30:20','2026-02-16 08:30:20'),(42,'17','Рабочий персонал','2026-02-16 08:30:20','2026-02-16 08:30:20'),(43,'2','Розничная торговля','2026-02-16 08:30:20','2026-02-16 08:30:20'),(44,'9','Сельское хозяйство','2026-02-16 08:30:20','2026-02-16 08:30:20'),(45,'21','Спортивные клубы, фитнес, салоны красоты','2026-02-16 08:30:20','2026-02-16 08:30:20'),(46,'4','Стратегия, инвестиции, консалтинг','2026-02-16 08:30:20','2026-02-16 08:30:20'),(47,'22','Страхование','2026-02-16 08:30:20','2026-02-16 08:30:20'),(48,'18','Строительство, недвижимость','2026-02-16 08:30:20','2026-02-16 08:30:20'),(49,'10','Транспорт, логистика, перевозки','2026-02-16 08:30:20','2026-02-16 08:30:20'),(50,'20','Туризм, гостиницы, рестораны','2026-02-16 08:30:20','2026-02-16 08:30:20'),(51,'12','Управление персоналом, тренинги','2026-02-16 08:30:20','2026-02-16 08:30:20'),(52,'3','Финансы, бухгалтерия','2026-02-16 08:30:20','2026-02-16 08:30:20'),(53,'13','Юристы','2026-02-16 08:30:20','2026-02-16 08:30:20'),(54,'27','Другое','2026-02-16 08:30:20','2026-02-16 08:30:20');
/*!40000 ALTER TABLE `professional_role_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professional_roles`
--

DROP TABLE IF EXISTS `professional_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professional_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hh_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `professional_role_category_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `professional_roles_hh_id_professional_role_category_id_unique` (`hh_id`,`professional_role_category_id`),
  KEY `professional_roles_professional_role_category_id_foreign` (`professional_role_category_id`),
  CONSTRAINT `professional_roles_professional_role_category_id_foreign` FOREIGN KEY (`professional_role_category_id`) REFERENCES `professional_role_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=541 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professional_roles`
--

LOCK TABLES `professional_roles` WRITE;
/*!40000 ALTER TABLE `professional_roles` DISABLE KEYS */;
INSERT INTO `professional_roles` VALUES (271,'4','Автомойщик',28,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(272,'5','Автослесарь, автомеханик',28,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(273,'62','Мастер-приемщик',28,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(274,'70','Менеджер по продажам, менеджер по работе с клиентами',28,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(275,'8','Администратор',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(276,'33','Делопроизводитель, архивариус',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(277,'58','Курьер',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(278,'76','Менеджер/руководитель АХО',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(279,'84','Оператор ПК, оператор базы данных',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(280,'88','Офис-менеджер',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(281,'93','Переводчик',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(282,'110','Секретарь, помощник руководителя, ассистент',29,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(283,'22','Военнослужащий',30,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(284,'90','Охранник',30,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(285,'95','Полицейский',30,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(286,'116','Специалист по информационной безопасности',30,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(287,'120','Специалист службы безопасности',30,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(288,'26','Генеральный директор, исполнительный директор (CEO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(289,'36','Директор по информационным технологиям (CIO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(290,'37','Директор по маркетингу и PR (CMO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(291,'38','Директор по персоналу (HRD)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(292,'166','Директор юридического департамента (CLO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(293,'53','Коммерческий директор (CCO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(294,'80','Начальник производства',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(295,'87','Операционный директор (COO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(296,'157','Руководитель отдела аналитики',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(297,'172','Руководитель отдела логистики',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(298,'170','Руководитель отдела маркетинга и рекламы',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(299,'171','Руководитель отдела персонала',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(300,'161','Руководитель филиала',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(301,'125','Технический директор (CTO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(302,'135','Финансовый директор (CFO)',31,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(303,'27','Геодезист',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(304,'28','Геолог',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(305,'168','Лаборант',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(306,'63','Машинист',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(307,'79','Научный специалист, исследователь',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(308,'82','Начальник смены, мастер участка',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(309,'49','Технолог',32,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(310,'8','Администратор',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(311,'21','Водитель',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(312,'23','Воспитатель, няня',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(313,'32','Дворник',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(314,'58','Курьер',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(315,'89','Официант, бармен, бариста',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(316,'90','Охранник',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(317,'130','Уборщица, уборщик',33,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(318,'66','Менеджер по закупкам',34,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(319,'119','Специалист по тендерам',34,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(320,'156','BI-аналитик, аналитик данных',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(321,'160','DevOps-инженер',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(322,'10','Аналитик',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(323,'12','Арт-директор, креативный директор',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(324,'150','Бизнес-аналитик',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(325,'25','Гейм-дизайнер',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(326,'165','Дата-сайентист',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(327,'34','Дизайнер, художник',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(328,'36','Директор по информационным технологиям (CIO)',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(329,'73','Менеджер продукта',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(330,'155','Методолог',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(331,'96','Программист, разработчик',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(332,'164','Продуктовый аналитик',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(333,'104','Руководитель группы разработки',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(334,'157','Руководитель отдела аналитики',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(335,'107','Руководитель проектов',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(336,'112','Сетевой инженер',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(337,'113','Системный администратор',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(338,'148','Системный аналитик',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(339,'114','Системный инженер',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(340,'116','Специалист по информационной безопасности',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(341,'121','Специалист технической поддержки',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(342,'124','Тестировщик',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(343,'125','Технический директор (CTO)',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(344,'126','Технический писатель',35,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(345,'12','Арт-директор, креативный директор',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(346,'13','Артист, актер, аниматор',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(347,'20','Видеооператор, видеомонтажер',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(348,'25','Гейм-дизайнер',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(349,'34','Дизайнер, художник',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(350,'41','Журналист, корреспондент',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(351,'55','Копирайтер, редактор, корректор',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(352,'98','Продюсер',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(353,'103','Режиссер, сценарист',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(354,'139','Фотограф, ретушер',36,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(355,'1','Event-менеджер',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(356,'2','PR-менеджер',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(357,'3','SMM-менеджер, контент-менеджер',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(358,'10','Аналитик',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(359,'12','Арт-директор, креативный директор',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(360,'34','Дизайнер, художник',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(361,'37','Директор по маркетингу и PR (CMO)',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(362,'55','Копирайтер, редактор, корректор',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(363,'163','Маркетолог-аналитик',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(364,'68','Менеджер по маркетингу, интернет-маркетолог',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(365,'70','Менеджер по продажам, менеджер по работе с клиентами',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(366,'71','Менеджер по работе с партнерами',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(367,'99','Промоутер',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(368,'170','Руководитель отдела маркетинга и рекламы',37,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(369,'8','Администратор',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(370,'15','Ассистент врача',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(371,'19','Ветеринарный врач',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(372,'24','Врач',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(373,'29','Главный врач, заведующий отделением',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(374,'42','Заведующий аптекой',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(375,'168','Лаборант',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(376,'64','Медицинская сестра, медицинский брат',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(377,'65','Медицинский представитель',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(378,'79','Научный специалист, исследователь',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(379,'151','Специалист по сертификации',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(380,'133','Фармацевт-провизор',38,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(381,'17','Бизнес-тренер',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(382,'23','Воспитатель, няня',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(383,'168','Лаборант',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(384,'167','Методист',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(385,'79','Научный специалист, исследователь',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(386,'101','Психолог',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(387,'132','Учитель, преподаватель, педагог',39,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(388,'6','Агент по недвижимости',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(389,'10','Аналитик',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(390,'154','Брокер',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(391,'51','Кассир-операционист',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(392,'53','Коммерческий директор (CCO)',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(393,'54','Координатор отдела продаж',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(394,'57','Кредитный специалист',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(395,'70','Менеджер по продажам, менеджер по работе с клиентами',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(396,'71','Менеджер по работе с партнерами',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(397,'83','Оператор call-центра, специалист контактного центра',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(398,'97','Продавец-консультант, продавец-кассир',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(399,'105','Руководитель отдела клиентского обслуживания',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(400,'106','Руководитель отдела продаж',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(401,'161','Руководитель филиала',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(402,'151','Специалист по сертификации',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(403,'121','Специалист технической поддержки',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(404,'122','Страховой агент',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(405,'129','Торговый представитель',40,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(406,'174','Инженер ПНР',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(407,'44','Инженер по качеству',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(408,'45','Инженер по охране труда и технике безопасности, инженер-эколог',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(409,'46','Инженер по эксплуатации',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(410,'48','Инженер-конструктор, инженер-проектировщик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(411,'169','Инженер-электроник, инженер-электронщик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(412,'144','Инженер-энергетик, инженер-электрик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(413,'149','Контролёр ОТК',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(414,'168','Лаборант',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(415,'162','Мастер по ремонту оборудования, техники',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(416,'63','Машинист',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(417,'152','Метролог',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(418,'173','Механик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(419,'79','Научный специалист, исследователь',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(420,'80','Начальник производства',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(421,'82','Начальник смены, мастер участка',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(422,'85','Оператор производственной линии',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(423,'86','Оператор станков с ЧПУ',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(424,'109','Сварщик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(425,'111','Сервисный инженер, инженер-механик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(426,'115','Слесарь, сантехник',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(427,'151','Специалист по сертификации',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(428,'49','Технолог',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(429,'128','Токарь, фрезеровщик, шлифовщик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(430,'141','Швея, портной, закройщик',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(431,'143','Электромонтажник',41,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(432,'5','Автослесарь, автомеханик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(433,'21','Водитель',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(434,'31','Грузчик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(435,'52','Кладовщик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(436,'59','Маляр, штукатур',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(437,'63','Машинист',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(438,'173','Механик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(439,'78','Монтажник',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(440,'85','Оператор производственной линии',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(441,'86','Оператор станков с ЧПУ',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(442,'102','Разнорабочий',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(443,'109','Сварщик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(444,'111','Сервисный инженер, инженер-механик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(445,'115','Слесарь, сантехник',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(446,'128','Токарь, фрезеровщик, шлифовщик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(447,'131','Упаковщик, комплектовщик',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(448,'143','Электромонтажник',42,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(449,'9','Администратор магазина, администратор торгового зала',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(450,'35','Директор магазина, директор сети магазинов',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(451,'77','Мерчандайзер',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(452,'97','Продавец-консультант, продавец-кассир',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(453,'99','Промоутер',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(454,'123','Супервайзер',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(455,'127','Товаровед',43,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(456,'7','Агроном',44,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(457,'19','Ветеринарный врач',44,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(458,'43','Зоотехник',44,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(459,'63','Машинист',44,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(460,'111','Сервисный инженер, инженер-механик',44,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(461,'49','Технолог',44,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(462,'8','Администратор',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(463,'56','Косметолог',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(464,'60','Массажист',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(465,'61','Мастер ногтевого сервиса',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(466,'70','Менеджер по продажам, менеджер по работе с клиентами',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(467,'92','Парикмахер',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(468,'138','Фитнес-тренер, инструктор тренажерного зала',45,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(469,'10','Аналитик',46,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(470,'150','Бизнес-аналитик',46,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(471,'75','Менеджер/консультант по стратегии',46,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(472,'107','Руководитель проектов',46,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(473,'134','Финансовый аналитик, инвестиционный аналитик',46,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(474,'11','Андеррайтер',47,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(475,'91','Оценщик',47,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(476,'122','Страховой агент',47,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(477,'6','Агент по недвижимости',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(478,'14','Архитектор',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(479,'154','Брокер',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(480,'27','Геодезист',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(481,'30','Главный инженер проекта',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(482,'34','Дизайнер, художник',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(483,'47','Инженер ПТО, инженер-сметчик',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(484,'45','Инженер по охране труда и технике безопасности, инженер-эколог',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(485,'46','Инженер по эксплуатации',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(486,'48','Инженер-конструктор, инженер-проектировщик',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(487,'59','Маляр, штукатур',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(488,'63','Машинист',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(489,'78','Монтажник',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(490,'100','Прораб, мастер СМР',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(491,'102','Разнорабочий',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(492,'107','Руководитель проектов',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(493,'108','Руководитель строительного проекта',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(494,'109','Сварщик',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(495,'115','Слесарь, сантехник',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(496,'143','Электромонтажник',48,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(497,'159','Бортпроводник',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(498,'21','Водитель',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(499,'31','Грузчик',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(500,'39','Диспетчер',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(501,'52','Кладовщик',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(502,'58','Курьер',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(503,'63','Машинист',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(504,'67','Менеджер по логистике, менеджер по ВЭД',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(505,'81','Начальник склада',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(506,'172','Руководитель отдела логистики',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(507,'131','Упаковщик, комплектовщик',49,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(508,'8','Администратор',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(509,'72','Менеджер по туризму',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(510,'74','Менеджер ресторана',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(511,'76','Менеджер/руководитель АХО',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(512,'89','Официант, бармен, бариста',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(513,'94','Повар, пекарь, кондитер',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(514,'130','Уборщица, уборщик',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(515,'140','Хостес',50,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(516,'17','Бизнес-тренер',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(517,'38','Директор по персоналу (HRD)',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(518,'153','Менеджер по компенсациям и льготам',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(519,'69','Менеджер по персоналу',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(520,'171','Руководитель отдела персонала',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(521,'117','Специалист по кадрам',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(522,'118','Специалист по подбору персонала',51,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(523,'16','Аудитор',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(524,'154','Брокер',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(525,'18','Бухгалтер',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(526,'50','Казначей',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(527,'158','Комплаенс-менеджер',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(528,'57','Кредитный специалист',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(529,'155','Методолог',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(530,'147','Специалист по взысканию задолженности',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(531,'134','Финансовый аналитик, инвестиционный аналитик',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(532,'135','Финансовый директор (CFO)',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(533,'136','Финансовый контролер',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(534,'137','Финансовый менеджер',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(535,'142','Экономист',52,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(536,'166','Директор юридического департамента (CLO)',53,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(537,'158','Комплаенс-менеджер',53,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(538,'145','Юрисконсульт',53,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(539,'146','Юрист',53,'2026-02-16 08:30:20','2026-02-16 08:30:20'),(540,'40','Другое',54,'2026-02-16 08:30:20','2026-02-16 08:30:20');
/*!40000 ALTER TABLE `professional_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rabota_rus`
--

DROP TABLE IF EXISTS `rabota_rus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rabota_rus` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `expires_in` int NOT NULL,
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rabota_rus_customer_id_foreign` (`customer_id`),
  CONSTRAINT `rabota_rus_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rabota_rus`
--

LOCK TABLES `rabota_rus` WRITE;
/*!40000 ALTER TABLE `rabota_rus` DISABLE KEYS */;
INSERT INTO `rabota_rus` VALUES (1,'2026-01-24 21:50:02','2026-02-13 10:33:05',41,1771065185,'YBPxkf8pVqjzKukYvOlgdgdrl2jsjthd','YBPxkf8pVqjzKukYvOlgdgdrl2jsjthd',NULL);
/*!40000 ALTER TABLE `rabota_rus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Администратор'),(2,'Гость'),(3,'Рекрутер'),(4,'Менеджер'),(5,'Клиент');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `schedules_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES (5,'Вахтовый метод'),(7,'Любой'),(6,'Неполный день'),(1,'Полный'),(3,'Свободный'),(2,'Сменный'),(4,'Удаленная работа');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('0Non9XpVg1wWSsySRTKuZ9PfE5RrztwtBcFnEvvc',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoieWM3eHpJcVJYZndQdmdiSDhuVE5RUmpveTF4TUUxem92SmdFQ210NSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770627632),('3b4bMZUrSRzkZgQAnlsD4mnIM1Rb2iJCeypNB5Dn',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoidHNOaHN6WFZjYnluTExhdkJxVHVuaG1HOWZ5VEFNaVVGRXNoVU9maCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly9tYWlsLmFkbWluLmpvYi1seS5ydSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1770981629),('3DGC2J1UfCyUOdSXtX6BeZ8qajTQ55316lk6Wgdj',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3','YTozOntzOjY6Il90b2tlbiI7czo0MDoiVnhaRXhIa3lPT1JBUXptRnFVUDdYSklBSzB5Tm1CRnNYQUY0eExpNiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUvaW5kZXgucGhwIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770717867),('3ZDan1SkwfD6yXwmDwdsTbHHY1FCnaqK0wCPtxWd',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoic01BRnJ4MzNTcmdsNzRBQjdNNXJ1NVkzd05jSFRSZkN5RnM2ODVJSiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjY6Imh0dHA6Ly9vd2EuYWRtaW4uam9iLWx5LnJ1Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770981472),('4F6OGLZJ0R7kVl402dUXOUX1D6zHwWEVaJx2MZg1',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiV3BVNDR6UFhjYkh2RE5mbDNjYjVwTHU0bkRXRE9Ha3BaekpLOExSZCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770791747),('4n0kvpAM74GQOzeRtc9QPkQRFyICjmIMvXonGIaz',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoieXp4TlFLbWd6Z1I5Y1l5SnJwRFA3QlpONjVuZXM0M3dpaDZuM3hPZiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770590360),('4PHFkLX0HtaLso86XbVFesuI5uRqfGNMEiUaaNDZ',NULL,'195.161.62.134','Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoieUpLajA4cnZuendsQ2I1dkhyQXhiWnlHSTJENkw2ZDIxNmRtd0lBSCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770919102),('5DaT6NdK27kSqEJRx3EpUVJ7C9MbYXkGYfvyYouN',NULL,'195.161.62.134','Mozilla/5.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNUg0N1B3ckZSQ1JIbTc5ZWFzaENycFZpOXVHM255Y242UEg5d2JuciI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MTQ1OiJodHRwOi8vYWRtaW4uam9iLWx5LnJ1Lz9mdW5jdGlvbj1jYWxsX3VzZXJfZnVuY19hcnJheSZzPSUyRkluZGV4JTJGJTVDdGhpbmslNUNhcHAlMkZpbnZva2VmdW5jdGlvbiZ2YXJzJTVCMCU1RD1zeXN0ZW0mdmFycyU1QjElNUQlNUIwJTVEPXByaW50ZW52Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770881419),('5lKVTb3m8nTtURRfUud4heLYl4SOy7rzfUWlnFy3',NULL,'195.161.62.134','Mozilla/5.0 (iPhone; CPU iphone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25','YTozOntzOjY6Il90b2tlbiI7czo0MDoiS3lIZURFWWZsdlNlZlM3Q3NVaWxaTzh5UTlxeXM5SFV2dXo3Qzc1TCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770631293),('8Mk2fEofGOmFlHD71W2d6yjJ78GiHlxoOwpjpJu2',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUzh6RkdQTlQ3Q3J1dUMwc0tLNFU0Vm9YVEd2SlBxZGcwV0lBZDRwYiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770595523),('8nGrmDSDxGXuwYabwp8pApuGYYCBJhQXNuUfEdYP',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWVh3a2xQMTBrWUNpbG9oRXExRDhtYUJqQnNKRGVremdsSmk4c29XYSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770600556),('91a2P0THg1ie2JDgoT4hC6nTm11txZtt37yNGD3C',NULL,'195.161.62.134','Mozilla/5.0(WindowsNT6.0)AppleWebKit/537.36(KHTML,likeGecko)Chrome/28.0.1500.95Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTnlNc0N6Z0t1N1pvWnlXcTFDMVhHbDh1VlpLU1ZQTkF1WlQ0SkI2TyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770599885),('9xcWBo6ZD6G3gktw45BcK64Uq2BTVGUH6604z5gY',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoia2VqZUllTWdrWHVsYnRCZ2dUNGdGZTV2ZG9JWXlWNmozRVN6TXQxNiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770643665),('aU5dAsOoewtRDPL6HFxt9zmDtbsiiSW2llmN60tx',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiMktPdE1JbWpZZVk0N3QxR0o4cGNLT1BmN2ZkNGxSM0daUTNoMkJhTCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770590353),('awcaTkTJMTEydP9oG0dFwzYrRkKa0BwNQ4AoMkfA',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWUhNOFpTV2p4YnhLMXNiTjRidGZDdmh2N3hxbEliemx3Z0taZXExQiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mjk6Imh0dHA6Ly9zZWN1cmUuYWRtaW4uam9iLWx5LnJ1Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770992990),('bJ9GUBv0mpDvcpAvmV5e9tdU3kU7cUfqGfjKB0Z1',NULL,'195.161.62.134','Mozilla/4.0(compatible;MSIE8.0;WindowsNT5.1;Trident/4.0;BTRS100671;.NETCLR2.0.50727;.NETCLR3.0.4506.2152;.NETCLR3.5.30729;OfficeLiveConnector.1.3;OfficeLivePatch.0.0;.NET4.0C;.NETCLR1.1.4322)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiaTNhZ29ERk43ZG5TNEc0NmdXYzc3VjdGYlA4S1lJMDFPZU9taWNRZyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770591835),('BntKMM2gn25m2Vfnai9MB9OGRAvaojnEa9Z7Csug',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRllPTkxMMkE5a3J2YUZKWDZLZkhqQWNtN2lFRkpYSVJGdDh2VVlvciI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770881402),('bSxX54XuG2YLkBdZksDtNRtl0n80I1cwg9BhTl14',NULL,'195.161.62.134','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQXV5c0c0Uk9QQ2g4MHZxMmFkQmVrNG5MZ0xnV0lHcnAzTHg5RlBJTyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770588023),('BvVDiOkvBis6Wvw40PDKwNCl3DIx0z0W1blG5eRe',NULL,'195.161.62.134','python-requests/2.32.4','YTozOntzOjY6Il90b2tlbiI7czo0MDoidWwxWU9ENnhWdEZSOWRSTXF2QVg4VjNVSEJXT0VyODdwTFdCbW9pMCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly9iLmFkbWluLmpvYi1seS5ydSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1770582716),('cMtVznWzyWLFSKrOeJVWJtDnFqQllwjHicEILSyv',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNU5nWVRQSld6QTJHT1VZTzAyRW1oZEhmejlNMkdsVEZ0WWVseE8xZyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770595533),('dgPkUci9q9NT7j89qqS7Rbjkp2tJS7JxXH9wDp79',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWjkwRUg2ckYzcmFNbzdPcUVDWTUyRlBrQzFmbFgxcHRmaXJJOUN4ZyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjY6Imh0dHA6Ly9zc2wuYWRtaW4uam9iLWx5LnJ1Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770963164),('di6EsPzpQMdoLyPXaovo1WQgYMjIJWfADvEdJvqi',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.182 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTU5HbFg2REJwaWlZMTVRSVZXZmJSNmJJNXU3MmQ3T0lGV1pXTUV4ZCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770587959),('eavj14gHWj3GicwWVDWrFuWQPyxLyZoBLd0UCS8h',NULL,'195.161.62.134','Mozilla/5.0 (Linux; Android 8.1.0; BBE100-2 Build/OPM1.171019.026) AppleWebKit/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiVkhTNkZBaEwxUk1NeDBQaTltMmliN1JUcEFMZWt6UkZURFNIR0hlWiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770674602),('EIX59HwzSZAC46lpo0tiCZbVohhPPOoEBdi2967x',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3','YTozOntzOjY6Il90b2tlbiI7czo0MDoiajd1WGVycHdEMGFFeTJJVURCZ0owa3JQV1RuNkJGMDBuQ3NxYUdKRyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770717865),('eOwddbbD31Yi9IGJSsTqPEFyq1a17oSpNUUby65v',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiN2lPUGFrenZpcnYzYzhqeDhDMko3dDBBRWZacG5vcXRKM29UbVdlcCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770590354),('ewM9fIR2pHebcQAQ6ghN0AcqdfNcQfkjhypdm1PW',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoieGhQcUxTSkFSRk1XUXZ2YnZmWjA1SmwxaDRYSnJBSndWTmlEVlQ4aCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770592179),('F3ujJK4QJPRoHK2eTKiRF1hd4NSetwmoxg8BE8w8',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiM3RLTGY1cEpDR05vNVpsdE9kT2NnMkQwaWFIMWVrb2R2Q1F5YzFociI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770592183),('fo50tHvuWOomTueRXv3QC8uQewOFpCj5H2OsRqn5',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSW9JenFtc1dJSjZPM010NFdEZHB4YzFyMEl6VE9ybDhGTTFtbWNHMyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770600555),('hnhlJvYEnrpzvD6ENGgyEKifWmExOOrmLNHBIAkT',NULL,'195.161.62.134','Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_3 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11B511','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZTNiOFkzajgwd2dtdnhQMGRrT09KZU1ORkJndkd4ckdhTzZOTlJ4ZyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770761027),('i5yOYWf7e6tCDejLr9qShqTUmfVTYbiGlLpbKJkb',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSUREVW1Na0xqMjlUSmlvMTFoQ1AxejF4bDFibFkyNlpOYnNMd0d1dSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770616544),('IBPBtKcJ6684zqOWk0TiDAknakn8TB9wx9DbcLZr',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiaVRHUEN4UzNkdkxjY056M2lFcEF3Z0JydWtBZXJOSVpwMU1tbmFTdiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly93ZWJtYWlsLmFkbWluLmpvYi1seS5ydSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1770993894),('in5n4ojryX5ksKy7CzuKE3uQRRXVrl0abKVlzZ0D',NULL,'195.161.62.134','Mozilla/5.0 (iPad; CPU OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTkVTekpDN3h0Rzh0TFlZeGR0SzN5bnBiOTUzU3dKTkkwTThVS2paYSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770974408),('ipkA3ZCzEdo0jhkAzMYkUjNxh0uYoxguO4azYm2Z',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSldmaTRiMjZ6VURWbnh1VWtxc2c0WXhwa2ZpSDRFeDdTcEJhZTBzSyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770791749),('jegz01HTSTUPTb9tjj5V0MkDvdBybb3lUb4R3kp3',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRlh2Tmx2RDVnMmI0UklJU1JNMHdEMEVTeGVaVXNVOG50d3hSazZoMyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770717861),('JY1nKLrC310cufsjcAyRMz6vbW55JmaRi3ATSYpk',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoidUN3MDIyOE1VQzJHblNrOXZwZmhMcTYxUzQ5YlJjSTh4bmtINUZJdyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770599176),('JYvFdCKu56KvVgBx1b9eIdV0qo0yQHs2d2kv7XuG',NULL,'195.161.62.134','Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiMWNvR0d0UTR4Q3ZQWGhKODhycE1YbWhPMk5vWWhhdmNvUGJ0QWhrVyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770650318),('KC92HQWh1kc4EQAc81nVJXCjooYunoWOYFXUyYvU',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiaXhzMExrYzJJYU4zMngxS3dmQmhualJQZ0dYdEsxYWF5ZHJ5bFZqaiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770881507),('ki65SvO5UnogEbE7R3KSmuLAV47VaPGSfpg7qlvG',NULL,'195.161.62.134','Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.3; +https://openai.com/gptbot)','YTozOntzOjY6Il90b2tlbiI7czo0MDoieHNMWFJXR09rUmh4VUs1eU4xUEdjc2xlNEhkZ3hDTHR0QWswOGVCdiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770817056),('kMM9tFXcgZAFLnoGGjCPP7hQn6WuTmYjw4cLzGeu',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36','YToyOntzOjY6Il90b2tlbiI7czo0MDoiVFZPTmg3cWZndVdKdzlkUG91RjhWSDNlZ1VvRm9iZTk1OGZ3Y05VciI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770635703),('kuxSODg1FIAw3fzsuAZFWGdhXqhpb2Lze2rGsPRp',NULL,'195.161.62.134','Mozilla/5.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZUtMcVNNTTBGU01vQnZ5TUZ4MlA3RGJ0UXZOUEM3ZmxnWHRFMHJoViI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770881414),('KzlWtWppopjoW163V9TbGp2FLOj2FaIhlVjRUHES',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiMmo5V2EybEUyempoQ2t0SG9yZUJXd3UyNVoweXlsQ01YRmF4bDNpUyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770598087),('lbWsloIaDLNx6XdSKo0Rgdv4R7aJKcrldaA2BoAG',NULL,'195.161.62.134','Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.16 Mobile/11A501','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTGlLOVM2MGFOeHRPc1BNVmJ0amFWbTFWTGIxcHJoc1dUZ1RyTmVtdiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770847426),('leXfKIqH2jThzn5XeN5TmhdjAmmLNFAR29iI5KVA',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQ01vOU5DcFpUVUpXN1huNURDU1ZuT3oxVFlLWW5PVmpPcEFGa2JxWCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770976478),('LusQAyHkRsjVr3ZGzsVLKlI4aIZuRyvIKsi6wKsM',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoieXBPUmMxNXc0N2tLNFkyc05vU3FMSkVFemdpdFJxcThmQnVIVGFteiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770656447),('mUmUclC6ogvczk1J0YOh1A6dg6vvAfZUQCInkB4I',NULL,'195.161.62.134','Mozilla/5.0(compatible;MSIE10.0;WindowsNT6.1;WOW64;Trident/6.0;SLCC2;.NETCLR2.0.50727;.NETCLR3.5.30729;.NETCLR3.0.30729;.NET4.0C;InfoPath.2;.NET4.0E)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWXJNMW1ZazJxS3Jlbkx2WFU0dUlIMjA4U2x5cGN2RjNYbjhkdm52ciI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770588203),('NFDryZsthqy0ZxxEZ3F1wJHkOLpLWlFOARsDmo5G',NULL,'195.161.62.134','Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNU45Y045NVRxUXNkcmNEcFlQQ0dXOEJYWk9Wc29HVDV6NGJUaW1ZZSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770632277),('nXNUzJ2iQBlTWW8c6QJw8JWyeQTG5OGLfTrGE6xA',NULL,'195.161.62.134','Hello from Palo Alto Networks, find out more about our scans in https://docs-cortex.paloaltonetworks.com/r/1/Cortex-Xpanse/Scanning-activity','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNTFVc1QzbDM4MmpkOElMam93bzkxUVpmY0I3aGhBT2pjcmYzbHJGUyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770961574),('PGwYA6gSmBtRLyo9h2tYG0ZBFSIgrz9iOssFUAQJ',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoia2R0YUJXSTJ6cDR6UkwyM25hZ2pqbE5jNEZTVWF5NlhDWVZlempFbiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770595522),('Q3oDPHdiRXhOG04xQgl2WTdjudI9wjbXESLKnqb7',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiVWpDY3RINE93SXFKRUIwUEc5ZXdXTmM5d1VIRVE3RmNscmlFT1hWQyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770888018),('QMfFFdJR7s5ylePzV4Xl3rg8gAmbgzXd9LJicMIy',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoieXh0UWhYVlI3SjJnZ0xtTnRuOER6V2xnaFdsTDF4cFZtaXpobml4NCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770903495),('QsbcuYHyMgNsFNn8jIGGQSi0uH62edBpwgcDCdoF',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUUpWSW1KQ0RaT3ZET0w0Nng0NDE2dDM1OERiWDAzN3dMcEFTZG5UVSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770888019),('QtNEcfSrkCRbS5UaHbjQZoSiD32xaexITKb3M0zO',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiaU4xSnB3dnZkcVJIQUlneFZSSDBLMlBNYUsxSU1tSGNFbFhIeVdEZSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770587963),('rqMiJLmyfWhFVdYjEej6txIl4gB7zEv4aoVNS90A',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux i686; rv:124.0) Gecko/20100101 Firefox/124.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUWphb1RPTng4VTJ1eDNJRWFYdDNWOVAxcFdiWUdmZkV5cjZWZjhXYyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770718126),('sPIlExCQPsTwZz7pEK1wmi2sHjAIbK9xQl1HPiRl',NULL,'195.161.62.134','Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4','YTozOntzOjY6Il90b2tlbiI7czo0MDoiYWRNTUU3QktLVlhVdlVIUGh6M3dmekUxMmxQRTc5YVJPamFaS1RvSyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770609936),('tM2axXBQ76v8CBZaEBC8b5s2nUrg83qqkoU8qNqI',NULL,'195.161.62.134','Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRGdnSVFkNXR4aXlqUUUxbXhHMXJHcDM4RGpHd3pxcHNEYnUxNTdXQiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770933861),('txsZcpx8xyTJD5n1VE1HjTBdUvEsLHCPpC7up9Nc',NULL,'195.161.62.134','python-requests/2.32.4','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRnMxVWtmN0toUktsZExDRnJscE4wMVU4V1JwT0psb0RYbVRYM2hHOCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly9hLmFkbWluLmpvYi1seS5ydSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1770581122),('tZbc0PvoI3sfqIBMyesqWgiyzBHq5dKIBCqUSUqH',NULL,'195.161.62.134','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTkpiWDZ1MWN0dlBwWUF1dEtzUDJUOWU1TVNwSE1rMHlFbHhiQzNZMSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770592187),('veSWHmypAnqcFhSGVFAo9BwHpiAH5DslrtD6t4nf',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQktLZ2lYTUpKQkNQY1ZyOEFnS0xlRlo5VGh4S0ZGak5nNFFMSjdTVCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770598087),('WwIWvkMQkOU3JvCvZwMJ6A34lktEEkxrYeRBlOgs',NULL,'195.161.62.134','python-requests/2.32.4','YTozOntzOjY6Il90b2tlbiI7czo0MDoiY05pdDAwN1lFa0FzZVFHYVdSdVY1ZVZvWDZlNGpOZFgxYjVQem5UWCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770581782),('wWQFblGtapabIMivvUZLrtu7L4LaYQ2EocC25O5B',NULL,'195.161.62.134','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZ0pvOG5DRHhuQTEyeHA0WjBrdW9hV3RDRmNJSjVRYnpVMmU4c3ZoYiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770598099),('x0JiJkbo6L5TfkTQ07N3NMLbYYFsdDSjiYayLM01',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoid3gxaTA0cEFURnNDYWtabzdEMTJDN3ZXYWRFOXljSFI1eDBjTk04VSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770635725),('x8Tjt1dyKgGuKg5zFL9lSPaP4jfpUgudXgAeykYU',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWVZsZmdMOEp3ZlltejB0Q21uNHNWdjBYUHFZSUNyUjFDZ3l2ZjZGbSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770658338),('xxpbrfqZc1voGVzmwaUOT1jOfRDzgTEOafNeqBLF',NULL,'195.161.62.134','Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.3; +https://openai.com/gptbot)','YTozOntzOjY6Il90b2tlbiI7czo0MDoidG9MbVNrVmFURXNEQUxQVHJOYTdycnhacjRvT1J1MWZXM0czUzBxMyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770591639),('Y5kkJPAgZ4HdtzsIlDWh1IwweEvwyZmGwfMi3ZQG',NULL,'195.161.62.134','Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiVklOQVB3aXBGbllsRExGZk5rZlZHdkhlRVhRNUNaMENYbmRXcXR2NiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770674773),('YAwOLgIpY0PkS3SSxzgfhFgZ8YZ0JpRrvDcpG8XI',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoibVllZGNlMmFSekVVblByWXJLS3FCVFNBaHVOSW1HVk5rbmJFRkZpOSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770588026),('YPYkCkcX4rNDWctR2AYo7hzIF8w81hDJIvBgl6HB',NULL,'195.161.62.134','Mozilla/5.0 (compatible; CMS-Checker/1.0; +https://example.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUVo5NXhRMFR2QUk2MnJQSTBqOUZzU3o1UjJQbzBBRkpsU1N1MmdOaiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770733247),('ytwJRwSLhG0O1QbHkWtP67uRtwM5FWuGApu2VfKQ',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoidzFudjJ2clhEUzk0V0l5ZUtwb3ZlaWhsZlJNakd3bkJuM3g3a3N5MiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770881408),('zJsX03QBl9ldpm9llt1klT1QmdUGWMGfrM9jfaSH',NULL,'195.161.62.134','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZ3VuVjd5bDM3SjlTaXZ4QUw0ZU5qTk4yenYxeDRHVVJFajlFd0tidCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770613243),('ZOjwjB5VmXbrgHbheskgBcK8oBxy9w2fZl2H5s8N',NULL,'195.161.62.134','Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)','YTozOntzOjY6Il90b2tlbiI7czo0MDoidlNkWUphaWNRT1JCVjhuSWVLN3ZaaUxWU1NoV3pweEp1b0pMWVlhOCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9hZG1pbi5qb2ItbHkucnUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1770592990);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specializations`
--

DROP TABLE IF EXISTS `specializations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specializations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `specializations_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specializations`
--

LOCK TABLES `specializations` WRITE;
/*!40000 ALTER TABLE `specializations` DISABLE KEYS */;
INSERT INTO `specializations` VALUES (11,'HR'),(2,'Администрирование'),(4,'Бизнес-аналитик'),(1,'Бухгалтерский учет'),(10,'Дизайн'),(7,'Консультирование'),(3,'Реклама'),(12,'Руководство'),(9,'Служба поддержки'),(8,'Финансовый аналитик');
/*!40000 ALTER TABLE `specializations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stages`
--

DROP TABLE IF EXISTS `stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fixed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stages`
--

LOCK TABLES `stages` WRITE;
/*!40000 ALTER TABLE `stages` DISABLE KEYS */;
INSERT INTO `stages` VALUES (1,'Не разобранное',1),(2,'Подумать',1),(3,'Подходящие',1),(4,'Отклоненные',1);
/*!40000 ALTER TABLE `stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `statuses_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (2,'Вакансия создана'),(1,'На рассмотрении'),(3,'Отклонена');
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'крутой'),(2,'тест'),(3,'тест2'),(4,'тест3');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_types`
--

DROP TABLE IF EXISTS `task_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_types`
--

LOCK TABLES `task_types` WRITE;
/*!40000 ALTER TABLE `task_types` DISABLE KEYS */;
INSERT INTO `task_types` VALUES (1,'Интервью'),(2,'Звонок'),(3,'Встреча'),(4,'Служба безопасности');
/*!40000 ALTER TABLE `task_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `executor_id` bigint unsigned NOT NULL,
  `candidate_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `timeFrom` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timeTo` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_id` bigint unsigned NOT NULL,
  `comment` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_executor_id_foreign` (`executor_id`),
  KEY `tasks_candidate_id_foreign` (`candidate_id`),
  KEY `tasks_type_id_foreign` (`type_id`),
  CONSTRAINT `tasks_candidate_id_foreign` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_executor_id_foreign` FOREIGN KEY (`executor_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `task_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'api-jw','api-jwt@jobly.ru',NULL,'$2y$12$53EHCIim/XK5shrhvB4SVuzP5WDJCVQ1pNBSOmibUGFyAi1Mndl4i',NULL,'2025-02-18 18:35:33','2025-02-18 18:35:33'),(2,'Local','gravielladesign@gmail.com',NULL,'$2y$12$l5qtWzhbjq365.fyyq1JM.hk646m393gjhIHf4FJ6x8ycDavRaFiS',NULL,'2026-02-16 06:14:21','2026-02-16 06:14:21');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacancies`
--

DROP TABLE IF EXISTS `vacancies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacancies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateEnd` date DEFAULT NULL,
  `specializations` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_hours_per_day` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_evening_night_shifts` tinyint(1) NOT NULL DEFAULT '0',
  `experience` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_from` int DEFAULT NULL,
  `salary_to` int DEFAULT NULL,
  `salary_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_frequency` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_payment_frequency` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `places` bigint unsigned DEFAULT NULL,
  `place_ids` json DEFAULT NULL,
  `oformlenie` json DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `work_address` text COLLATE utf8mb4_unicode_ci,
  `customer_id` bigint unsigned DEFAULT NULL,
  `executor_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `executor_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `executor_phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `executor_id` bigint unsigned DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `peoples` smallint unsigned DEFAULT NULL,
  `show_executor` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vacancies_places_foreign` (`places`),
  KEY `vacancies_customer_id_foreign` (`customer_id`),
  KEY `vacancies_executor_id_foreign` (`executor_id`),
  CONSTRAINT `vacancies_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vacancies_executor_id_foreign` FOREIGN KEY (`executor_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vacancies_places_foreign` FOREIGN KEY (`places`) REFERENCES `places` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacancies`
--

LOCK TABLES `vacancies` WRITE;
/*!40000 ALTER TABLE `vacancies` DISABLE KEYS */;
INSERT INTO `vacancies` VALUES (1,'2025-05-14 19:53:48','2025-05-14 19:53:48','Технический директор 3','director 3','Описание вакансии',NULL,'Руководство','IT и телекоммуникации','Полная','Полный',NULL,0,'От 3 до 6 лет','Высшее',100000,200000,NULL,'RUB (рубль)',NULL,NULL,1,NULL,NULL,'Санкт-Петербург, ул. Дорожная, д2',NULL,NULL,28,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL),(59,'2025-06-16 05:11:39','2026-02-07 15:01:50','Менеджер по работе с клиентами','1234','<p>Мы частная школа \"Пифагор\". И сейчас, в связи с расширением, ищем менеджера по работе с клиентами — человека, который будет помогать клиентам, вести их запросы и сконсультировать в подборе нужных опций и деталей. Работа понятная, с готовыми инструкциями — подойдёт даже при небольшом опыте, главное, это желание взаимодействовать в команде и развиваться</p><p></p><p><strong>Условия:</strong></p><ol><li><p>— Удалённую работу (вам нужен будет стабильный интернет - это главное)</p></li><li><p>— Понятные задачи + регламенты, шаблоны сообщений и CRM</p></li><li><p>— Гибкий график / смены (можно обсудить формат под вас индивидуально)</p></li><li><p>— Стабильные выплаты (2 раза в месяц на руки)</p></li><li><p>— Подготовка, треннинги и мастерклассы для повышения квалификации</p></li><li><p>— Перспектива роста до старшего менеджера и даже тимлида </p></li></ol><p></p><p><strong>Обязанности:</strong></p><ol><li><p>Общаться с клиентами в чате/мессенджерах/почте (без “холодных” — по входящим)</p></li><li><p>Консультировать по услугам/продукту и помогать выбрать подходящее решение</p></li><li><p>Принимать заявки, уточнять детали, фиксировать информацию в CRM</p></li><li><p>Сопровождать клиента: статусы, сроки, напоминания, согласования</p></li><li><p>Передавать сложные вопросы в профильные отделы и контролировать, чтобы клиент получил ответ</p></li><li><p>Вести простую отчётность (таблица/CRM) и поддерживать порядок по обращениям</p></li></ol><p></p><p><strong>Требования:</strong></p><ol><li><p>— Грамотная письменная речь, вежливый и спокойный тон</p></li><li><p>— Внимательность и ответственность (не терять обращения, соблюдать сроки)</p></li><li><p>— Уверенный ПК (браузер, таблицы, понимание \"что такое CRM\")</p></li><li><p>— Умение работать в темпе и переключаться между задачами</p></li></ol><p>Если вам нравится общение с людьми и вы хотите стабильную удалённую работу — откликайтесь. Указывайте в резюме свой опты работы</p>','2025-12-06','Директор по маркетингу и PR (CMO)','Высший и средний менеджмент','Полная','Удаленная работа',NULL,0,'От 1 до 3 лет','Высшее',70000,90000,NULL,'RUB (рубль)',NULL,NULL,1,NULL,NULL,'Санкт-Петербург, посёлок Парголово, Заречная улица, 15к1',NULL,NULL,41,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL),(65,'2025-07-28 18:11:55','2025-07-28 18:11:55','Новая вакансия',NULL,'Описание для новой вакансии',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,41,NULL,NULL,NULL,35,'active',NULL,NULL,NULL,NULL),(73,'2025-09-14 20:30:02','2025-09-14 20:49:32','Учитель начальных классов',NULL,'<p>&lt;ul&gt; &lt;li&gt;&lt;span&gt;Отпуск 56 календарных дней летом;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;Основная занятость с 8:30 - 15:00 с понедельника по пятницу;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;Небольшие классы до 15 детей;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;Методическое сопровождение;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;15 минут от метро Парнас;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;Возможность взять часы ГПД;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;Работа в сплоченном коллективе;&lt;/span&gt;&lt;/li&gt; &lt;li&gt;&lt;span&gt;Официальное трудоустройство.&lt;/span&gt;&lt;/li&gt; &lt;/ul&gt;</p><ul><li><p>кенкен</p></li><li><p>гщгшщгш</p></li><li><p>шщгшщ</p></li></ul>',NULL,'Образование','Сельское хозяйство','null','null',NULL,0,'null','null',NULL,NULL,NULL,'RUB (рубль)',NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,41,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL),(81,'2025-10-23 18:37:34','2025-10-23 18:37:34','Водитель',NULL,'<p>dghfghfgh</p>',NULL,NULL,NULL,'null','null',NULL,0,'null','null',40000,80000,NULL,'RUB (рубль)',NULL,NULL,1,NULL,NULL,'Москва',NULL,NULL,41,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL),(82,'2025-10-24 05:05:50','2025-10-24 05:05:50','Тимлид',NULL,'<p>1231231231232213</p>','2025-11-01',NULL,NULL,'null','null',NULL,0,'null','null',20000,30000,NULL,'RUB (рубль)',NULL,NULL,1,NULL,NULL,'Минск',NULL,NULL,41,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL),(88,'2025-11-02 23:34:10','2025-11-02 23:34:10','Официант',NULL,'<p>dgdfgdf</p>',NULL,NULL,NULL,'null','null',NULL,0,'null','null',20000,30000,NULL,'RUB (рубль)',NULL,NULL,1,NULL,NULL,'Москва',NULL,NULL,41,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL),(106,'2026-02-16 08:49:13','2026-02-16 08:49:13','Водитель категории Б','63738','<h2><strong>Мы крупнейший, международный партнер Яндекс такси!</strong></h2><p>Любой формат, выбирай что больше по душе:<br>Сменный - подойдет для подработки, <strong>самый выгодный вариант!</strong><br>Аренда - совмещай с собственными делами.<br>Раскат - если с опытом и запрягаешь в долгую.</p><p>Свободный график, быстрые выплаты на карту, премии от Яндекс такси, за часы пик и зоны высокого спроса.<br>Машина проходит ТО, всегда чистая и готова к работе. Оформим быстро, есть все страховки и поддержка 24/7.<br>За смену можно заработать до 15 000 ₽, чаевые — твои. Всё легально</p><h2><strong>Любые тарифы от эконома до бизнеса.<br>Филиалы по всему городу - экономь на дороге.</strong></h2><h2></h2><p>Твоя энергия = твои деньги! На авто компании, поддержка и обучение бесплатно. Смены по выбору, на линии — всегда с заказами.<br><br>Количество свободных авто ограничено, не откладывай - <strong>звони прям сейчас!</strong></p><p>Водитель такси, работа в такси, работа в такси на автомобиле компании, водитель такси в санкт-петербурге, работа в такси в спб, лучшие таксопарки, водитель Яндекс такси, работа в Санкт-Петербурге водитель категории B, водитель яндекс такси, водитель подработка, работа в такси на автомобиле компании, водитель такси в Санкт-петербурге, работа в такси СПб, работа в Санкт-Петербурге, водитель на авто компании, ежедневные выплаты, водитель легкового автомобиля. Водитель такси, работа в такси, в такси на автомобиле компании, водитель такси в санкт-петербурге, работа в такси в спб, лучшие таксопарки, водитель Яндекс такси, работа в Санкт-Петербурге, таксовичкоф водитель категории B, водитель яндекс такси, подработка, работа в такси на автомобиле компании, водитель такси в Санкт-петербурге, работа в такси СПб, работа в Санкт-Петербурге, водитель на авто компании, выплаты, водитель легкового автомобиля. такси авто яндекс такси работа авто такси Работа такси аренда машина водитель такси работа водитель в прокат, авто, авто прокат, автопрокат, прокат авто, в аренду для такси, авто в аренду, аренда авто в спб, аренда авто под такси, аренда авто в Санкт-Петербурге, аренда автомобиль, авто напрокат, авто в аренду, авто в СПБ, авто под такси, не дорогой прокат, не дорогая аренда авто, прокат авто в Санкт-Петербурге, приоритет заказов бесплатно, без первого взноса, авто комфорт класса под такси, авто под такси с лицензией, бесплатный путевой лист, прокат машин без водителя, авто с выкупом, взять, снять в прокат машину, авто для работы, такси в аренду, такси, авто под, взять авто в аренду, автомобили под такси, автомобили аренда, аренда машина под такси</p>','2026-02-20','Водитель',NULL,'Полная','5/2','8',0,'Нет опыта',NULL,60000,90000,NULL,'RUB (рубль)','За месяц','Раз в месяц',1,NULL,'[]','Санкт-Петербург',NULL,'Санкт-Петербург, посёлок Парголово, Заречная улица, 15к1',41,NULL,NULL,NULL,NULL,'active',NULL,NULL,1,NULL),(107,'2026-02-16 08:52:59','2026-02-16 08:52:59','Водитель категории Б','987263','<h2><strong>Мы крупнейший, международный партнер Яндекс такси!</strong></h2><p>Любой формат, выбирай что больше по душе:<br>Сменный - подойдет для подработки, <strong>самый выгодный вариант!</strong><br>Аренда - совмещай с собственными делами.<br>Раскат - если с опытом и запрягаешь в долгую.</p><p>Свободный график, быстрые выплаты на карту, премии от Яндекс такси, за часы пик и зоны высокого спроса.<br>Машина проходит ТО, всегда чистая и готова к работе. Оформим быстро, есть все страховки и поддержка 24/7.<br>За смену можно заработать до 15 000 ₽, чаевые — твои. Всё легально</p><h2><strong>Любые тарифы от эконома до бизнеса.<br>Филиалы по всему городу - экономь на дороге.</strong></h2><h2></h2><p>Твоя энергия = твои деньги! На авто компании, поддержка и обучение бесплатно. Смены по выбору, на линии — всегда с заказами.<br><br>Количество свободных авто ограничено, не откладывай - <strong>звони прям сейчас!</strong></p><p>Водитель такси, работа в такси, работа в такси на автомобиле компании, водитель такси в санкт-петербурге, работа в такси в спб, лучшие таксопарки, водитель Яндекс такси, работа в Санкт-Петербурге водитель категории B, водитель яндекс такси, водитель подработка, работа в такси на автомобиле компании, водитель такси в Санкт-петербурге, работа в такси СПб, работа в Санкт-Петербурге, водитель на авто компании, ежедневные выплаты, водитель легкового автомобиля. Водитель такси, работа в такси, в такси на автомобиле компании, водитель такси в санкт-петербурге, работа в такси в спб, лучшие таксопарки, водитель Яндекс такси, работа в Санкт-Петербурге, таксовичкоф водитель категории B, водитель яндекс такси, подработка, работа в такси на автомобиле компании, водитель такси в Санкт-петербурге, работа в такси СПб, работа в Санкт-Петербурге, водитель на авто компании, выплаты, водитель легкового автомобиля. такси авто яндекс такси работа авто такси Работа такси аренда машина водитель такси работа водитель в прокат, авто, авто прокат, автопрокат, прокат авто, в аренду для такси, авто в аренду, аренда авто в спб, аренда авто под такси, аренда авто в Санкт-Петербурге, аренда автомобиль, авто напрокат, авто в аренду, авто в СПБ, авто под такси, не дорогой прокат, не дорогая аренда авто, прокат авто в Санкт-Петербурге, приоритет заказов бесплатно, без первого взноса, авто комфорт класса под такси, авто под такси с лицензией, бесплатный путевой лист, прокат машин без водителя, авто с выкупом, взять, снять в прокат машину, авто для работы, такси в аренду, такси, авто под, взять авто в аренду, автомобили под такси, автомобили аренда, аренда машина под такси</p>','2026-02-21','Водитель',NULL,'Полная','5/2','8',0,'Нет опыта',NULL,60000,90000,NULL,'RUB (рубль)','За месяц','Раз в месяц',1,NULL,'[]','Кабардино-Балкарская Республика, Нальчик',NULL,'Кабардино-Балкарская Республика, Нальчик, улица Ватутина, 23',41,NULL,NULL,NULL,NULL,'active',NULL,NULL,1,NULL),(111,'2026-02-16 09:17:01','2026-02-16 09:17:01','Менеджер по продажам (тест)','TEST-001','<p>Обязанности:</p>\r\n<ul><li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li><li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li></ul>\r\n<p>Требования:</p>\r\n<ul><li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li><li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li></ul>\r\n<p>Условия:</p>\r\n<ul><li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li><li>Опыт работы от 1 года.</li><li>Навыки ведения переговоров.</li><li>Грамотная речь.</li></ul>','2025-12-31','Автомойщик','Автомобильный бизнес','Подработка','Другое','Другое',0,'От 6 лет','Высшее',50000,90000,NULL,'RUB (рубль)','За месяц','За проект',1,NULL,'[\"labor\"]','Санкт-Петербург',NULL,'ул. Тверская, д. 1',41,'Иван Иванов','test@example.com','+79991234567',NULL,'active','Тестовый комментарий к вакансии. Ссылка на вакансию: https://example.com/vacancy',NULL,1,NULL),(112,'2026-02-16 09:17:46','2026-02-16 13:52:26','Менеджер по продажам (водитель)9','TEST-009','<p>Обязанности:</p><ul><li><p>Опыт работы от 100 года.</p></li><li><p>Навыки ведения переговоров.</p></li><li><p>Грамотная речь.</p></li><li><p>Опыт работы от 1 года.</p></li><li><p>Навыки ведения переговоров.</p></li><li><p>Грамотная речь.</p></li></ul><p>Требования:</p><ul><li><p>Опыт работы от 1 года.</p></li><li><p>Навыки ведения переговоров.</p></li><li><p>Грамотная речь.</p></li><li><p>Опыт работы от 1 года.</p></li><li><p>Навыки ведения переговоров.</p></li><li><p>Грамотная речь.</p></li></ul><p>Условия:</p><ul><li><p>Опыт работы от 1 года.</p></li><li><p>Навыки ведения переговоров.</p></li><li><p>Грамотная речь.</p></li><li><p>Опыт работы от 1 года.</p></li><li><p>Навыки ведения переговоров.</p></li><li><p>Грамотная речь.</p></li></ul>','2026-03-09','Делопроизводитель, архивариус','Автомобильный бизнес','Полная','Другое','Другое',1,'Нет опыта','Высшее',30000,40000,NULL,'EUR (евро)','За смену','Ежедневно',2,'[2, 3, 4]','[\"labor\", \"internship\"]','Кабардино-Балкарская Республика, Нальчик','[]','Москва, Заречная улица, 7',41,'Иван Иванов','test@example.com','+79991234567',NULL,'active','Тестовый комментарий к вакансии. Ссылка на вакансию: https://example.com/vacancy','Программирование',90,NULL);
/*!40000 ALTER TABLE `vacancies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacancies_custom`
--

DROP TABLE IF EXISTS `vacancies_custom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacancies_custom` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `industry_id` bigint unsigned NOT NULL,
  `specializations_id` bigint unsigned NOT NULL,
  `employment_id` bigint unsigned NOT NULL,
  `schedule_id` bigint unsigned NOT NULL,
  `experience_id` bigint unsigned NOT NULL,
  `education_id` bigint unsigned NOT NULL,
  `salary_from` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency_id` bigint unsigned NOT NULL,
  `place_id` bigint unsigned NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phrases` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vacancies_custom_name_unique` (`name`),
  UNIQUE KEY `vacancies_custom_code_unique` (`code`),
  KEY `vacancies_custom_industry_id_foreign` (`industry_id`),
  KEY `vacancies_custom_specializations_id_foreign` (`specializations_id`),
  KEY `vacancies_custom_employment_id_foreign` (`employment_id`),
  KEY `vacancies_custom_schedule_id_foreign` (`schedule_id`),
  KEY `vacancies_custom_experience_id_foreign` (`experience_id`),
  KEY `vacancies_custom_education_id_foreign` (`education_id`),
  KEY `vacancies_custom_currency_id_foreign` (`currency_id`),
  KEY `vacancies_custom_place_id_foreign` (`place_id`),
  CONSTRAINT `vacancies_custom_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `vacancies_custom_education_id_foreign` FOREIGN KEY (`education_id`) REFERENCES `education` (`id`),
  CONSTRAINT `vacancies_custom_employment_id_foreign` FOREIGN KEY (`employment_id`) REFERENCES `employments` (`id`),
  CONSTRAINT `vacancies_custom_experience_id_foreign` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`),
  CONSTRAINT `vacancies_custom_industry_id_foreign` FOREIGN KEY (`industry_id`) REFERENCES `industries` (`id`),
  CONSTRAINT `vacancies_custom_place_id_foreign` FOREIGN KEY (`place_id`) REFERENCES `places` (`id`),
  CONSTRAINT `vacancies_custom_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`),
  CONSTRAINT `vacancies_custom_specializations_id_foreign` FOREIGN KEY (`specializations_id`) REFERENCES `specializations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacancies_custom`
--

LOCK TABLES `vacancies_custom` WRITE;
/*!40000 ALTER TABLE `vacancies_custom` DISABLE KEYS */;
/*!40000 ALTER TABLE `vacancies_custom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacancy_platform`
--

DROP TABLE IF EXISTS `vacancy_platform`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacancy_platform` (
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `vacancy_id` bigint unsigned NOT NULL,
  `platform_id` bigint unsigned NOT NULL,
  `base_vacancy_id` bigint unsigned DEFAULT NULL,
  `vacancy_platform_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  KEY `vacancy_platform_vacancy_id_foreign` (`vacancy_id`),
  KEY `vacancy_platform_platform_id_foreign` (`platform_id`),
  KEY `vacancy_platform_base_vacancy_id_foreign` (`base_vacancy_id`),
  CONSTRAINT `vacancy_platform_base_vacancy_id_foreign` FOREIGN KEY (`base_vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vacancy_platform_platform_id_foreign` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vacancy_platform_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacancy_platform`
--

LOCK TABLES `vacancy_platform` WRITE;
/*!40000 ALTER TABLE `vacancy_platform` DISABLE KEYS */;
/*!40000 ALTER TABLE `vacancy_platform` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-16 14:01:48
