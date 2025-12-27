CREATE DATABASE barangay_db;
USE barangay_db;
--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
INSERT INTO `admins` VALUES (1,'admin','$2b$10$9H0n9oAftJhRaKcaMXtirec/8vdpHmc7h4HM46ddj/Vpr4ILBKxaK','Super Admin','2025-11-14 06:15:48');

UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;

CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date_posted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_archived` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;

INSERT INTO `announcements` VALUES (1,'Clean-up Drive this Weekend','Join our barangay clean-up drive on October 25 at 7 AM. Meeting point: Barangay Hall.','2025-11-14 12:33:58',0);

UNLOCK TABLES;



DROP TABLE IF EXISTS `news`;

CREATE TABLE `news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(2083) NOT NULL,
  `link_url` varchar(2083) DEFAULT NULL,
  `date_posted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_archived` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;

INSERT INTO `news` VALUES (1,'Bulacan solon rejects link to Discayas in flood control probe','MANILA, Philippines — Without outright denying the claims, Rep. Salvador Pleyto (Bulacan, 6th District) rejected Ombudsman Boying Remulla\'s assertion that he received "remittances" from a contractor of a substandard flood control project prior to entering Congress in 2022.','https://media.philstar.com/photos/2025/10/24/salvador-pleyto_2025-10-24_11-17-42.jpg','https://www.philstar.com/headlines/2025/10/24/2482202/bulacan-solon-rejects-link-discayas-flood-control-probe','2025-11-14 12:50:31',0),(2,'DOH: No outbreak of influenza-like illnesses','MANILA – Department of Health (DOH) Secretary Teodoro Herbosa on Tuesday clarified that there is no outbreak of influenza-like illnesses (ILI) in the country, stressing that the current increase in cases is part of the usual seasonal flu trend during the colder months.','https://files01.pna.gov.ph/category-list/2023/09/04/ybl5742.jpg','https://www.pna.gov.ph/articles/1260968','2025-11-14 12:51:24',0),(3,'DepEd declares \'wellness break\' for public schools Oct. 27–30','MANILA, Philippines — The Department of Education has declared a four-day "wellness break" for public schools nationwide from October 27 to 30 to allow teachers and students to rest and recover from the impact of recent disasters and the rise in flu-like illnesses.','https://media.philstar.com/photos/2023/06/06/2_2023-06-06_23-07-34.jpg','https://www.philstar.com/headlines/2025/10/23/2481956/deped-declares-wellness-break-public-schools-oct-2730','2025-11-14 12:52:36',0);
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;

CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
    `tracking_id` varchar(30) NOT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `barangay_id_path` varchar(255) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `other_category_details` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `evidence_path` varchar(255) NOT NULL,
  `date_submitted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `priority` enum('Low (Minor issue, not urgent)','High (Urgent, immediate action required)','Emergency (Critical, immediate response required)') NOT NULL,
  `address` varchar(255) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` enum('Pending','In Progress','Resolved') DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_id` (`tracking_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;

INSERT INTO `reports` VALUES (6,'RD-20251114-001','Jane Dela Cruz','uploads/1763086692886-sample_id.png','road',NULL,'the road is cracked','uploads/1763086692887-Screenshot 2025-11-14 101652.png','2025-11-14 02:18:12','Low (Minor issue, not urgent)','Caltex, Norzagaray-Santa Maria Road, Pulong Buhangin, Pulong Yantok, Santa Maria, Bulacan, Central Luzon, 3022, Philippines',14.86373290,120.99287796,'Pending'),
(8,'STL-20251113-001','Anonymous',NULL,'streetlight',NULL,'broken streetlight making the road be dark at night','uploads/1763106338538-Screenshot 2025-11-14 154443.png','2025-11-13 07:45:38','Low (Minor issue, not urgent)','Pulong Buhangin, Santa Maria, Bulacan, Central Luzon, 3022, Philippines',14.86465374,120.99048328,'Pending'),
(9,'GRB-20251112-001','Anonymous',NULL,'garbage',NULL,'the garbage collector is not collecting our garbage for a month','uploads/1763106696132-Screenshot 2025-11-14 155031.png','2025-11-12 07:51:36','High (Urgent, immediate action required)','Pulong Buhangin, Pulong Yantok, Santa Maria, Bulacan, Central Luzon, 3012, Philippines',14.88321072,121.01176071,'Resolved'),
(10,'RD-20251110-001','Anonymous',NULL,'road',NULL,'the road here is always flooded even if there is no rain','uploads/1763106886314-Screenshot 2025-11-14 155416.png','2025-11-10 07:54:46','Low (Minor issue, not urgent)','Pulong Buhangin, Santa Maria, Bulacan, Central Luzon, 3012, Philippines',14.88168442,121.00465393,'In Progress'),
(11,'GRB-20251114-002','Anonymous',NULL,'garbage',NULL,'they are throwing their garbage at our house','uploads/1763107546171-Screenshot 2025-11-14 160501.png','2025-11-14 08:05:46','High (Urgent, immediate action required)','Pulong Buhangin, Santa Maria, Bulacan, Central Luzon, 3022, Philippines',14.86336788,120.98930740,'Pending');

UNLOCK TABLES;

--
-- Table structure for table `tracking_id_counter`
--

CREATE TABLE `tracking_id_counter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` varchar(8) NOT NULL COMMENT 'YYYYMMDD format',
  `category_abbr` varchar(3) NOT NULL,
  `counter` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date_category` (`date`, `category_abbr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `suggestions`
--

DROP TABLE IF EXISTS `suggestions`;

CREATE TABLE `suggestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `suggestion_id` varchar(20) NOT NULL UNIQUE,
  `suggestion_text` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `date_submitted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Dumping data for table `suggestions`
--

LOCK TABLES `suggestions` WRITE;

UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;

CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `user_name` varchar(255) DEFAULT 'Anonymous',
  `action_type` varchar(50) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `record_id` varchar(100) DEFAULT NULL,
  `description` text,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping routines for database 'barangay_db'
--

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CreateAnnouncement`(
    IN p_title VARCHAR(255),
    IN p_description TEXT
)
BEGIN
    INSERT INTO announcements (title, description)
    VALUES (p_title, p_description);
    -- Return the new announcement
    SELECT 
        id, 
        title, 
        description, 
        DATE_FORMAT(date_posted, '%b %d, %Y') AS date
    FROM announcements WHERE id = LAST_INSERT_ID();
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CreateNews`(
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_image_url VARCHAR(2083),
    IN p_link_url VARCHAR(2083)
)
BEGIN
    INSERT INTO news (title, description, image_url, link_url)
    VALUES (p_title, p_description, p_image_url, p_link_url);
    -- Return the new news item
    SELECT 
        id, 
        title, 
        description,
        image_url AS imageUrl,
        link_url AS linkUrl,
        DATE_FORMAT(date_posted, '%b %d, %Y') AS date
    FROM news WHERE id = LAST_INSERT_ID();
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_ArchiveAnnouncement`(
    IN p_id INT
)
BEGIN
    UPDATE announcements
    SET is_archived = 1
    WHERE id = p_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_ArchiveNews`(
    IN p_id INT
)
BEGIN
    UPDATE news
    SET is_archived = 1
    WHERE id = p_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetAdminProfile`(
    IN p_admin_id INT
)
BEGIN
    SELECT 
        id,
        username,
        display_name,
        DATE_FORMAT(date_created, '%b %d, %Y') AS date_created
    FROM admins
    WHERE id = p_admin_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_UpdateAdminProfile`(
    IN p_admin_id INT,
    IN p_display_name VARCHAR(255)
)
BEGIN
    UPDATE admins
    SET display_name = p_display_name
    WHERE id = p_admin_id;
    
    SELECT id, username, display_name FROM admins WHERE id = p_admin_id;
END ;;
DELIMITER ;

DELIMITER ;;
DROP PROCEDURE IF EXISTS `sp_DeleteSuggestion` ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_DeleteSuggestion`(
    IN p_suggestion_id INT
)
BEGIN
    DELETE FROM suggestions
    WHERE id = p_suggestion_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetAllReports`()
BEGIN
    SELECT 
        tracking_id AS trackingId,
        fullname AS name,
        barangay_id_path AS photo,
        category,
        description,
        address,
        latitude,
        longitude,
        evidence_path AS areaPhoto,
        status,
        CASE 
            WHEN priority = 'Low (Minor issue, not urgent)' THEN 'Low'
            WHEN priority = 'High (Urgent, immediate action required)' THEN 'High'
            WHEN priority = 'Emergency (Critical, immediate response required)' THEN 'Emergency'
            ELSE 'Other'
        END AS priority,
        DATE_FORMAT(date_submitted, '%Y-%m-%d') AS date
    FROM reports
    ORDER BY date_submitted DESC;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetAnnouncements`()
BEGIN
    SELECT 
        id, 
        title, 
        description, 
        DATE_FORMAT(date_posted, '%b %d, %Y') AS date
    FROM announcements
    WHERE is_archived = 0
    ORDER BY date_posted DESC;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetDashboardStats`()
BEGIN
    SELECT 
        category,
        COALESCE(COUNT(*), 0) AS reported,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'resolved' THEN 1 ELSE 0 END), 0) AS solved
    FROM 
        reports
    GROUP BY 
        category;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetNews`()
BEGIN
    SELECT 
        id, 
        title, 
        description,
        image_url AS imageUrl,
        link_url AS linkUrl,
        DATE_FORMAT(date_posted, '%b %d, %Y') AS date
    FROM news
    WHERE is_archived = 0
    ORDER BY date_posted DESC;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetReportByTrackingId`(
    IN p_tracking_id VARCHAR(30)
)
BEGIN
    SELECT 
        tracking_id AS trackingId,
        fullname AS name,
        barangay_id_path AS photo,
        category,
        description,
        evidence_path AS areaPhoto,
        status,
        CASE 
            WHEN priority = 'Low (Minor issue, not urgent)' THEN 'Low'
            WHEN priority = 'High (Urgent, immediate action required)' THEN 'High'
            WHEN priority = 'Emergency (Critical, immediate response required)' THEN 'Emergency'
            ELSE 'Other'
        END AS priority,
        DATE_FORMAT(date_submitted, '%Y-%m-%d') AS date
    FROM reports
    WHERE tracking_id = p_tracking_id;
END ;;
DELIMITER ;

DELIMITER ;;
DROP PROCEDURE IF EXISTS `sp_GetSuggestions` ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetSuggestions`()
BEGIN
    SELECT 
        id,
        suggestion_id AS suggestionId,
        suggestion_text AS suggestionText,
        is_read AS isRead,
        DATE_FORMAT(date_submitted, '%Y-%m-%d') AS date
    FROM suggestions
    ORDER BY date_submitted DESC;
END ;;
DELIMITER ;

DELIMITER ;;
DROP PROCEDURE IF EXISTS `sp_MarkSuggestionAsRead` ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_MarkSuggestionAsRead`(
    IN p_suggestion_id INT
)
BEGIN
    UPDATE suggestions
    SET is_read = 1
    WHERE id = p_suggestion_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetNextTrackingId`(
    IN p_category VARCHAR(100),
    IN p_date VARCHAR(8),
    OUT o_tracking_id VARCHAR(30)
)
BEGIN
    DECLARE v_category_abbr VARCHAR(3);
    DECLARE v_counter INT;
    
    SELECT CASE 
        WHEN LOWER(p_category) = 'garbage' THEN 'GRB'
        WHEN LOWER(p_category) = 'streetlight' OR LOWER(p_category) = 'street light' THEN 'STL'
        WHEN LOWER(p_category) = 'road' OR LOWER(p_category) = 'road repair' THEN 'RD'
        WHEN LOWER(p_category) = 'water' THEN 'WTR'
        ELSE 'OTH'
    END INTO v_category_abbr;
    
    INSERT INTO tracking_id_counter (date, category_abbr, counter)
    VALUES (p_date, v_category_abbr, 1)
    ON DUPLICATE KEY UPDATE counter = counter + 1;
    
    SELECT counter INTO v_counter
    FROM tracking_id_counter
    WHERE date = p_date AND category_abbr = v_category_abbr;
    
    SET o_tracking_id = CONCAT(v_category_abbr, '-', p_date, '-', LPAD(v_counter, 3, '0'));
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SubmitReport`(
    IN p_tracking_id VARCHAR(30),
    IN p_fullname VARCHAR(255),
    IN p_category VARCHAR(100),
    IN p_description TEXT,
    IN p_priority ENUM('Low (Minor issue, not urgent)', 'High (Urgent, immediate action required)', 'Emergency (Critical, immediate response required)'),
    IN p_address VARCHAR(255),
    IN p_latitude DECIMAL(10, 8),
    IN p_longitude DECIMAL(11, 8),
    IN p_barangay_id_path VARCHAR(255),
    IN p_evidence_path VARCHAR(255)
)
BEGIN
    INSERT INTO reports (
        tracking_id, 
        fullname, 
        category, 
        description, 
        priority, 
        address, 
        latitude, 
        longitude, 
        barangay_id_path, 
        evidence_path
    )
    VALUES (
        p_tracking_id, 
        p_fullname, 
        p_category, 
        p_description, 
        p_priority, 
        p_address, 
        p_latitude, 
        p_longitude, 
        p_barangay_id_path, 
        p_evidence_path
    );
END ;;
DELIMITER ;

DELIMITER ;;
DROP PROCEDURE IF EXISTS `sp_SubmitSuggestion` ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SubmitSuggestion`(
    IN p_suggestion_text TEXT
)
BEGIN
    DECLARE v_suggestion_id VARCHAR(20);
    DECLARE v_date_part VARCHAR(8);
    DECLARE v_counter INT;
    
    SET v_date_part = DATE_FORMAT(NOW(), '%Y%m%d');
    
    SELECT COUNT(*) + 1 INTO v_counter
    FROM suggestions
    WHERE DATE(date_submitted) = CURDATE();
    
    SET v_suggestion_id = CONCAT(v_date_part, LPAD(v_counter, 3, '0'));
    
    INSERT INTO suggestions (suggestion_id, suggestion_text)
    VALUES (v_suggestion_id, p_suggestion_text);
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_UpdateAnnouncement`(
    IN p_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT
)
BEGIN
    UPDATE announcements
    SET 
        title = p_title,
        description = p_description
    WHERE id = p_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_UpdateNews`(
    IN p_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_image_url VARCHAR(2083),
    IN p_link_url VARCHAR(2083)
)
BEGIN
    UPDATE news
    SET 
        title = p_title,
        description = p_description,
        image_url = p_image_url,
        link_url = p_link_url
    WHERE id = p_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_UpdateReportStatus`(
    IN p_tracking_id VARCHAR(30),
    IN p_new_status ENUM('Pending', 'In Progress', 'Resolved')
)
BEGIN
    UPDATE reports
    SET status = p_new_status
    WHERE tracking_id = p_tracking_id;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LogAuditAction`(
    IN p_admin_id INT,
    IN p_user_name VARCHAR(255),
    IN p_action_type VARCHAR(50),
    IN p_table_name VARCHAR(100),
    IN p_record_id VARCHAR(100),
    IN p_description TEXT
)
BEGIN
    INSERT INTO audit_logs (admin_id, user_name, action_type, table_name, record_id, description)
    VALUES (p_admin_id, COALESCE(p_user_name, 'Anonymous'), p_action_type, p_table_name, p_record_id, p_description);
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetAuditLogs`()
BEGIN
    SELECT 
        id,
        admin_id AS adminId,
        user_name AS user,
        action_type AS actionType,
        table_name AS tableName,
        record_id AS recordId,
        description,
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp
    FROM audit_logs
    ORDER BY timestamp DESC;
END ;;
DELIMITER ;
