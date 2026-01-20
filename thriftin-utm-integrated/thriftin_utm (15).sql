-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 20, 2026 at 09:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `thriftin_utm`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `create_conversation` (IN `p_user1_id` INT, IN `p_user2_id` INT, IN `p_is_ai` TINYINT, IN `p_product_id` INT)   BEGIN
    DECLARE v_conv_id INT;
    
    -- 检查是否已存在对话
    SELECT conversation_id INTO v_conv_id
    FROM conversations
    WHERE (participant_1_id = p_user1_id AND participant_2_id = p_user2_id)
       OR (participant_1_id = p_user2_id AND participant_2_id = p_user1_id)
    LIMIT 1;
    
    IF v_conv_id IS NULL THEN
        -- 创建新对话
        INSERT INTO conversations (participant_1_id, participant_2_id, is_ai_conversation, product_id)
        VALUES (p_user1_id, p_user2_id, p_is_ai, p_product_id);
        
        SET v_conv_id = LAST_INSERT_ID();
    END IF;
    
    SELECT v_conv_id AS conversation_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `log_user_activity` (IN `p_user_id` INT, IN `p_event` VARCHAR(50), IN `p_product_id` INT)   BEGIN
    INSERT INTO analytics_logs (user_id, event, product_id)
    VALUES (p_user_id, p_event, p_product_id);
    
    -- 如果是浏览产品，更新产品浏览次数
    IF p_event = 'view_product' AND p_product_id IS NOT NULL THEN
        UPDATE products 
        SET view_count = view_count + 1 
        WHERE product_id = p_product_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `send_message` (IN `p_conversation_id` INT, IN `p_sender_id` INT, IN `p_message_text` TEXT, IN `p_message_type` VARCHAR(20))   BEGIN
    DECLARE v_receiver_id INT;
    
    -- 插入消息
    INSERT INTO messages (conversation_id, sender_id, message_text, message_type)
    VALUES (p_conversation_id, p_sender_id, p_message_text, p_message_type);
    
    -- 找到接收者
    SELECT CASE 
        WHEN participant_1_id = p_sender_id THEN participant_2_id
        ELSE participant_1_id
    END INTO v_receiver_id
    FROM conversations
    WHERE conversation_id = p_conversation_id;
    
    -- 创建通知
    INSERT INTO notifications (user_id, sender_id, conversation_id, message_preview, notification_type)
    VALUES (v_receiver_id, p_sender_id, p_conversation_id, 
            LEFT(p_message_text, 100), 'new_message');
    
    -- 更新对话时间
    UPDATE conversations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE conversation_id = p_conversation_id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`user_id`) VALUES
(7);

-- --------------------------------------------------------

--
-- Table structure for table `admin_actions`
--

CREATE TABLE `admin_actions` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `target_user_id` int(11) NOT NULL,
  `action_type` enum('temporary_suspension','permanent_suspension','reinstate','other') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_actions`
--

INSERT INTO `admin_actions` (`id`, `admin_id`, `target_user_id`, `action_type`, `created_at`) VALUES
(1, 7, 17, 'temporary_suspension', '2025-12-15 10:30:00'),
(2, 7, 19, 'permanent_suspension', '2025-12-01 10:30:00'),
(3, 7, 17, 'reinstate', '2025-12-24 00:39:06'),
(4, 7, 17, 'reinstate', '2025-12-24 00:43:46'),
(5, 7, 17, 'reinstate', '2025-12-24 01:01:52');

--
-- Triggers `admin_actions`
--
DELIMITER $$
CREATE TRIGGER `after_admin_action` AFTER INSERT ON `admin_actions` FOR EACH ROW BEGIN
    DECLARE v_action_msg VARCHAR(200);
    
    SET v_action_msg = CASE NEW.action_type
        WHEN 'temporary_suspension' THEN 'Your account has been temporarily suspended.'
        WHEN 'permanent_suspension' THEN 'Your account has been permanently suspended.'
        WHEN 'reinstate' THEN 'Your account has been reinstated.'
        ELSE 'An admin action has been taken on your account.'
    END;
    
    INSERT INTO notifications (user_id, sender_id, notification_type, message_preview)
    VALUES (NEW.target_user_id, NEW.admin_id, 'admin_action', v_action_msg);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `analytics_logs`
--

CREATE TABLE `analytics_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event` varchar(50) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `analytics_logs`
--

INSERT INTO `analytics_logs` (`log_id`, `user_id`, `event`, `product_id`, `timestamp`) VALUES
(1, 20, 'view_product', 1, '2025-12-02 13:10:00'),
(2, 23, 'view_product', 5, '2025-12-02 13:12:00'),
(3, 21, 'open_app', NULL, '2025-12-02 09:00:00'),
(4, 22, 'view_product', 4, '2025-12-02 10:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `blocked_users`
--

CREATE TABLE `blocked_users` (
  `block_id` int(11) NOT NULL,
  `blocker_id` int(11) NOT NULL,
  `blocked_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `blocked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `chat_activity`
-- (See below for the actual view)
--
CREATE TABLE `chat_activity` (
`conversation_id` int(11)
,`user1_id` int(11)
,`user1_name` varchar(255)
,`user2_id` int(11)
,`user2_name` varchar(255)
,`is_ai_conversation` tinyint(1)
,`message_count` bigint(21)
,`last_message_time` timestamp
,`conversation_started` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `conversation_id` int(11) NOT NULL,
  `participant_1_id` int(11) NOT NULL,
  `participant_2_id` int(11) NOT NULL,
  `is_ai_conversation` tinyint(1) DEFAULT 0,
  `product_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`conversation_id`, `participant_1_id`, `participant_2_id`, `is_ai_conversation`, `product_id`, `created_at`, `updated_at`) VALUES
(1, 13, 25, 1, NULL, '2025-12-07 05:25:38', '2026-01-20 08:32:33'),
(2, 13, 20, 0, NULL, '2025-12-07 05:25:38', '2025-11-17 17:15:00'),
(3, 13, 21, 0, NULL, '2025-12-07 05:25:38', '2026-01-19 16:36:37'),
(4, 13, 22, 0, NULL, '2026-01-19 09:56:13', '2026-01-19 09:56:13'),
(5, 13, 24, 0, NULL, '2026-01-19 13:33:00', '2026-01-19 13:40:42');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_text` text DEFAULT NULL,
  `message_type` enum('text','image','file','ai_quick_action') DEFAULT 'text',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `conversation_id`, `sender_id`, `message_text`, `message_type`, `is_read`, `created_at`) VALUES
(1, 1, 25, 'Hello! I\'m your AI Shopping Assistant 👋\nI can help you with:\n• Finding textbooks within your budget\n• Negotiating better prices\n• General buying and selling advice\nHow can I assist you today?', 'text', 1, '2025-11-17 16:00:00'),
(2, 1, 13, 'Show me popular textbooks', 'text', 1, '2025-12-07 05:36:57'),
(3, 1, 25, 'I\'m here to assist you! I can help with:\n\n📚 Finding textbooks based on your budget\n💰 Negotiating prices effectively\n📖 Information about books and sellers\n🔍 Searching for specific subjects\n\nJust ask me anything about textbook shopping!', 'text', 1, '2025-12-07 05:36:58'),
(4, 2, 20, 'Sure! Let me know when you\'re free.', 'text', 1, '2025-11-17 17:15:00'),
(5, 2, 13, 'Hi, is the textbook still available?', 'text', 1, '2025-11-17 17:10:00'),
(6, 3, 13, 'Is the calculator still available?', 'text', 1, '2025-11-17 02:21:00'),
(7, 3, 21, 'Yes, it is still available', 'text', 1, '2025-11-17 02:20:00'),
(8, 4, 13, 'Hi', 'text', 0, '2026-01-19 09:56:20'),
(9, 1, 13, 'How to buy?', 'text', 0, '2026-01-19 13:32:25'),
(10, 5, 13, 'Hi\n', 'text', 0, '2026-01-19 13:33:08'),
(11, 5, 13, 'Hello\n', 'text', 0, '2026-01-19 13:40:42'),
(16, 3, 13, 'Hi?', 'text', 0, '2026-01-19 16:36:37'),
(225, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:12:04'),
(226, 1, 25, 'Hello! I can certainly help you find great deals.\n\nWe have **9 items** listed', 'text', 1, '2026-01-20 06:12:07'),
(227, 1, 13, 'Help me negotiate a price', 'text', 0, '2026-01-20 06:12:46'),
(228, 1, 25, '', 'text', 1, '2026-01-20 06:12:49'),
(229, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:15:30'),
(230, 1, 25, 'Hello! That’s a fantastic budget for finding great deals.\n\nI found **9', 'text', 1, '2026-01-20 06:15:33'),
(231, 1, 13, 'Hello', 'text', 0, '2026-01-20 06:19:09'),
(232, 1, 25, 'Hello! Welcome to ThriftIn UTM. I see you have 3 active listings—that\'s great!\n\nAs your AI Shopping Assistant, I can help you navigate the marketplace. We currently have **10** items available across Books, Electronics, and Furniture.\n\nI can help you:\n1. Find specific items (like the \'Scientific Calculator\' or \'Office Chair\').\n2. Get pricing advice for your listings.\n3. Share negotiation tips or answer buying/selling process questions.\n\nHow can I assist you today?', 'text', 1, '2026-01-20 06:19:13'),
(233, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:20:20'),
(234, 1, 25, 'Hello there! I can certainly help you find great deals.\n\nI found **10 items', 'text', 1, '2026-01-20 06:20:23'),
(235, 1, 13, 'List them out', 'text', 0, '2026-01-20 06:20:43'),
(236, 1, 25, '', 'text', 1, '2026-01-20 06:20:47'),
(237, 1, 13, 'Help me negotiate a price', 'text', 0, '2026-01-20 06:21:00'),
(238, 1, 25, 'That’s a smart move! Negotiation is standard here at ThriftIn UTM.\n\nHere are quick tips for successful price negotiation, whether you\'re buying or selling:\n\n1.  **Research the Price:** Know the condition and original listing price (e.g., the \'Office Chair\' is listed at RM80, condition \'Good\'). Check if similar items are listed lower.\n2.  **Be Specific:** Never just ask', 'text', 1, '2026-01-20 06:21:03'),
(239, 1, 13, 'Price for an old book?\n', 'text', 0, '2026-01-20 06:22:26'),
(240, 1, 25, 'That’s a great question! Pricing used books depends heavily on their **condition** and whether', 'text', 1, '2026-01-20 06:22:29'),
(241, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:26:08'),
(242, 1, 25, '', 'text', 1, '2026-01-20 06:26:11'),
(243, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:26:51'),
(244, 1, 25, 'I found 9 items under RM50:\n\n1. Calculator App Guide\n   💰 RM10.00 | Like New | Books\n\n2. Scientific Calculator\n   💰 RM45.00 | Like New | Electronics\n\n3. Backpack\n   💰 RM35.00 | Excellent | Others\n\n4. Data Structures Textbook\n   💰 RM35.00 | Good | Books\n\n5. Book Shelf\n   💰 RM30.00 | Excellent | Furniture\n\n6. Introduction to Algorithms\n   💰 RM40.00 | Excellent | Books\n\n7. Python Programming Book\n   💰 RM22.00 | Excellent | Books\n\n8. USB Hub 4-Port\n   💰 RM18.00 | Like New | Electronics\n\n9. Computational Mathematics\n   💰 RM15.00 | Excellent | Books\n\nWould you like more details?', 'text', 1, '2026-01-20 06:26:52'),
(245, 1, 13, 'Help me negotiate a price', 'text', 0, '2026-01-20 06:27:04'),
(246, 1, 25, 'Here are tips for negotiating:\n\n1. Research market prices first\n2. Be polite and respectful\n3. Point out any defects\n4. Offer to meet conveniently\n5. Be ready to compromise\n\nGood luck!', 'text', 1, '2026-01-20 06:27:05'),
(247, 1, 13, 'Suggest  a reasonable price for an oldbook', 'text', 0, '2026-01-20 06:27:36'),
(248, 1, 25, 'I can help you with:\n\n📦 Finding items in any category\n💰 Pricing advice\n🤝 Negotiation tips\n📖 Buying/selling guidance\n\nCategories: Books, Electronics, Fashion, Furniture, Others\n\nWhat would you like to know?', 'text', 1, '2026-01-20 06:27:37'),
(249, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:37:31'),
(250, 1, 25, '', 'text', 1, '2026-01-20 06:37:34'),
(251, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:39:57'),
(252, 1, 25, '', 'text', 1, '2026-01-20 06:40:01'),
(253, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 06:50:22'),
(254, 1, 25, '', 'text', 1, '2026-01-20 06:50:25'),
(255, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 07:00:33'),
(256, 1, 25, 'I found 9 items under RM50:\n\n1. Calculator App Guide\n   💰 RM10.00 | Like New | Books\n\n2. Scientific Calculator\n   💰 RM45.00 | Like New | Electronics\n\n3. Backpack\n   💰 RM35.00 | Excellent | Others\n\n4. Data Structures Textbook\n   💰 RM35.00 | Good | Books\n\n5. Book Shelf\n   💰 RM30.00 | Excellent | Furniture\n\n6. Introduction to Algorithms\n   💰 RM40.00 | Excellent | Books\n\n7. Python Programming Book\n   💰 RM22.00 | Excellent | Books\n\n8. USB Hub 4-Port\n   💰 RM18.00 | Like New | Electronics\n\n9. Computational Mathematics\n   💰 RM15.00 | Excellent | Books\n\nWould you like more details?', 'text', 1, '2026-01-20 07:00:37'),
(257, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 07:09:59'),
(258, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 07:21:25'),
(259, 1, 25, 'I found 9 items under RM50:\n\n1. Calculator App Guide\n   💰 RM10.00 | Like New | Books\n\n2. Scientific Calculator\n   💰 RM45.00 | Like New | Electronics\n\n3. Backpack\n   💰 RM35.00 | Excellent | Others\n\n4. Data Structures Textbook\n   💰 RM35.00 | Good | Books\n\n5. Book Shelf\n   💰 RM30.00 | Excellent | Furniture\n\n6. Introduction to Algorithms\n   💰 RM40.00 | Excellent | Books\n\n7. Python Programming Book\n   💰 RM22.00 | Excellent | Books\n\n8. USB Hub 4-Port\n   💰 RM18.00 | Like New | Electronics\n\n9. Computational Mathematics\n   💰 RM15.00 | Excellent | Books\n\nWould you like more details?', 'text', 1, '2026-01-20 07:21:37'),
(260, 1, 13, 'Help me negotiate a price', 'text', 0, '2026-01-20 07:29:17'),
(261, 1, 25, 'Hello there! Welcome to ThriftIn UTM, your go-to spot for sustainable finds and amazing deals right here on campus. I\'m your AI Shopping Assistant, and I\'m thrilled to help you navigate our collection.\n\nHow can I assist you today? Are you looking for something specific, curious about our latest arrivals, want to know about upcoming events, or just browsing for some inspiration? Let me know how I can make your ThriftIn UTM experience fantastic!', 'text', 1, '2026-01-20 07:29:20'),
(262, 1, 13, 'Suggest the price for an old book. The book condition is 8/10.', 'text', 0, '2026-01-20 07:30:12'),
(263, 1, 25, 'I can help you with:\n\n📦 Finding items in any category\n💰 Pricing advice\n🤝 Negotiation tips\n📖 Buying/selling guidance\n\nCategories: Books, Electronics, Fashion, Furniture, Others\n\nWhat would you like to know?', 'text', 1, '2026-01-20 07:30:16'),
(264, 1, 13, 'I need a scientific calculator for my exam.', 'text', 0, '2026-01-20 07:31:53'),
(265, 1, 25, 'I can help you with:\n\n📦 Finding items in any category\n💰 Pricing advice\n🤝 Negotiation tips\n📖 Buying/selling guidance\n\nCategories: Books, Electronics, Fashion, Furniture, Others\n\nWhat would you like to know?', 'text', 1, '2026-01-20 07:31:57'),
(266, 1, 13, 'I see you have a scientific calculator, is it good for engineering students?', 'text', 0, '2026-01-20 07:46:40'),
(267, 1, 25, 'I can help you with:\n\n📦 Finding items in any category\n💰 Pricing advice\n🤝 Negotiation tips\n📖 Buying/selling guidance\n\nCategories: Books, Electronics, Fashion, Furniture, Others\n\nWhat would you like to know?', 'text', 1, '2026-01-20 07:46:40'),
(268, 1, 13, 'I\'m looking for a calculator for my engineering class, do you have any?', 'text', 0, '2026-01-20 08:05:26'),
(269, 1, 25, 'Hello there! Welcome to ThriftIn UTM, your sustainable and affordable marketplace right here in the UTM community!\n\nI\'m your AI Shopping Assistant, and I\'m thrilled you stopped by. Whether you\'re hunting for a unique vintage piece, need dorm essentials, or want to declutter your closet responsibly, I’m here to help you navigate our listings.\n\n**How can I assist you with your thrifting adventure today?**\n\nHere are a few things I can help you with immediately:\n\n1.  **Finding Specific Items:** \"Show me all the size Medium sweaters,\" or \"Are there any textbooks for ECO100?\"\n2.  **Selling/Listing Items:** \"How do I post my gently used items?\" (I can provide quick tips on pricing and quality photos.)\n3.  **Pickup/Drop-off Logistics:** \"What are the common meetup spots near campus?\"\n4.  **Browsing Categories:** \"What are the most popular categories this week?\" (e.g., Winter Gear, Dorm Decor, Sustainable Fashion.)\n\nJust tell me what\'s on your mind, and let\'s find you some fantastic, sustainable deals! Happy thrifting!', 'text', 1, '2026-01-20 08:05:31'),
(270, 1, 13, 'I\'m looking for a calculator for my engineering class, do you have any?', 'text', 0, '2026-01-20 08:05:54'),
(271, 1, 25, 'Hello! Welcome to **ThriftIn UTM**!\n\nI\'m your AI Shopping Assistant, and I\'m here to help you navigate our fantastic collection of second-hand treasures, find the best sustainable deals, and connect with the UTM community.\n\nWhether you\'re hunting for a specific textbook, stylish clothing, dorm decor, or just looking for the best value, I\'m ready to search our listings.\n\n**What can I help you find today, or how can I assist you in starting your thrifting adventure?**', 'text', 1, '2026-01-20 08:05:58'),
(272, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 08:06:15'),
(273, 1, 25, 'Hello! I\'m your dedicated AI Shopping Assistant for ThriftIn UTM. I\'m excited to help you navigate the world of sustainable and affordable shopping right here on campus!\n\nThriftIn UTM is a fantastic initiative focused on promoting circularity, reducing waste, and providing accessible second-hand items to the UTM community.\n\nTo provide you with the most helpful information, here are the key details about shopping, donating, and finding us:\n\n---\n\n### 🛍️ Your Guide to ThriftIn UTM\n\n#### 1. Location and Operating Hours\n\n*   **Where to Find Us:** ThriftIn UTM typically operates as a pop-up shop or is located within a designated space in the **UTM Student Centre (SC)**. Look for signage near the main common areas or check the lower level.\n*   **Operating Hours (Crucial Note):** Because ThriftIn UTM is often student-run and volunteer-based, the hours are **not always fixed.**\n    *   **Best Practice:** Always check the official **UTM Student Union (UTMSU) social media** channels or the **UTM Sustainability** group\'s Instagram', 'text', 1, '2026-01-20 08:06:20'),
(274, 1, 13, 'Show me items below RM30', 'text', 0, '2026-01-20 08:19:06'),
(275, 1, 25, 'Welcome to ThriftIn UTM! I\'m your dedicated AI Shopping Assistant, here to help you uncover amazing, sustainable finds.\n\nWhether you\'re hunting for a specific vintage piece, need details on our latest clothing drops, want to check store hours near the UTM campus, or have questions about our donation process, I\'m ready to assist.\n\n**What can I help you thrift today?** Just let me know what you\'re looking for, and I\'ll provide the best information available!', 'text', 1, '2026-01-20 08:19:11'),
(276, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 08:19:46'),
(277, 1, 25, 'Hello! Welcome to ThriftIn UTM. I\'m your dedicated AI Shopping Assistant, here to help you navigate our racks, find the best deals, and shop sustainably on campus.\n\nWhether you\'re hunting for affordable textbooks, stylish vintage finds, or just need to know our current hours or donation policy, I\'m ready to assist.\n\n**What can I help you find today?**\n\n*   **Inventory Check:** What specific items are you looking for (e.g., sweaters, denim, dorm decor)?\n*   **Store Info:** Hours, location, or payment methods?\n*   **Sustainable Shopping Tips:** How to repair, upcycle, or donate items?\n*   **Student Deals:** Information on current sales or student discounts?\n\nJust let me know your question, and let\'s find you a great find!', 'text', 1, '2026-01-20 08:19:51'),
(278, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 08:24:10'),
(279, 1, 25, 'Hello there! Welcome to **ThriftIn UTM**! I\'m your dedicated AI Shopping Assistant, and I\'m thrilled you\'re prioritizing sustainable style.\n\nHere at ThriftIn UTM, we believe every piece has a story, and finding those unique scores is half the fun!\n\n**How can I help you find your next great thrifty treasure today?**\n\nI can assist with:\n\n1.  **Inventory Checks:** Looking for a specific item (e.g., \"Do you have any size M sweaters right now?\")\n2.  **Store Logistics:** Providing current hours, location details, or information on our donation drop-off schedule.\n3.  **Policy Questions:** Explaining our return/exchange policy or pricing structure.\n4.  **Style Inspiration:** Suggesting sustainable trends or tips for successful thrift shopping.\n\nJust tell me what\'s on your mind, and let\'s get you thrifting! Happy hunting! ♻️', 'text', 1, '2026-01-20 08:24:14'),
(280, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 08:24:24'),
(281, 1, 25, 'Welcome to ThriftIn UTM! I\'m your dedicated AI Shopping Assistant, here to help you navigate the best sustainable and affordable finds right here on campus.\n\nSince I don\'t have your specific question, I\'ll provide you with the most helpful initial information to get you started on your thrifting journey at UTD:\n\n### Your Quick Guide to ThriftIn UTM\n\n**1. Location & Accessibility:**\nWe are conveniently located [***Assumption: Near a central campus hub***] on the ground floor of the Student Union, next to the Comet Card Office. We aim to be easily accessible between classes!\n\n**2. What We Carry (Focus on Student Needs):**\nOur inventory is curated specifically for the UTD community. You can typically find:\n*   **Campus Essentials:** Affordable UTD spirit wear (Comet gear), casual basics, and workout clothes.\n*   **Professional Wear:** Gently used business attire perfect for career fairs, interviews, and networking events.\n*   **Dorm & Apartment Decor:** Unique items, organizational tools, and small electronics (availability varies daily).\n*   **Seasonal Items:** Jackets, sweaters, and formal wear for campus events.\n\n**3. Hours of Operation:**\nOur typical academic semester hours are:\n*   **Monday – Friday:** 11:00 AM – 6:00 PM\n*   **Saturday:** 12:00 PM – 4:00 PM\n*(Note: Always check our social media or the UTD Student Services page for holiday or break hour changes!)*\n\n**4. Sustainability & Donations:**\nWe are proud to support UTD’s sustainability initiatives. We accept donations of gently used clothing and small', 'text', 1, '2026-01-20 08:24:31'),
(282, 1, 13, 'Find items under RM50', 'text', 0, '2026-01-20 08:30:58'),
(283, 1, 25, '• Calculator App Guide - RM10.00\n• Scientific Calculator - RM45.00\n• Backpack - RM35.00\n• Data Structures Textbook - RM35.00\n• Book Shelf - RM30.00\n• Introduction to Algorithms - RM40.00\n• Python Programming Book - RM22.00\n• Study Desk Lamp - RM25.00\n• USB Hub 4-Port - RM18.00\n• Computational Mathematics - RM15.00\n• Algorithm Design Manual - RM20.00\n• Programming Fundamentals Book - RM18.00\n• Long Skirt Black - RM12.00\n• Wireless Mouse - RM15.00', 'text', 1, '2026-01-20 08:31:02'),
(284, 1, 13, 'What\'s the best price I can get for the Backpack?', 'text', 0, '2026-01-20 08:32:33'),
(285, 1, 25, 'The price currently listed for the Backpack in our inventory is:\n\n• Backpack - RM35.00 (Excellent, Others)', 'text', 1, '2026-01-20 08:32:35');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `conversation_id` int(11) DEFAULT NULL,
  `message_preview` varchar(100) DEFAULT NULL,
  `notification_type` enum('new_message','system_update','product_sold','admin_action') DEFAULT 'new_message',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `sender_id`, `conversation_id`, `message_preview`, `notification_type`, `is_read`, `created_at`, `read_at`) VALUES
(1, 13, 20, 2, 'Sure! Let me know when you are free.', 'new_message', 0, '2025-11-17 18:15:00', NULL),
(2, 13, 21, 3, 'Yes, it is still available', 'new_message', 1, '2025-11-17 17:30:00', '2025-12-07 16:55:22'),
(3, 13, 20, 2, 'Is the book still available?', 'new_message', 1, '2025-11-17 02:20:00', '2025-12-09 22:16:36');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('credit_card','e_wallet','online_banking','wallet') NOT NULL,
  `order_status` enum('completed','cancelled') DEFAULT 'completed',
  `order_date` datetime DEFAULT current_timestamp(),
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `buyer_id`, `total_amount`, `payment_method`, `order_status`, `order_date`, `cancelled_at`) VALUES
(1, 13, 20.00, 'credit_card', 'completed', '2025-12-29 16:38:39', NULL),
(2, 13, 25.00, 'e_wallet', 'completed', '2025-12-29 20:50:44', NULL),
(3, 13, 25.00, 'wallet', 'completed', '2026-01-06 12:26:27', NULL),
(4, 20, 40.00, 'credit_card', 'completed', '2025-12-25 14:30:00', NULL),
(5, 20, 30.00, 'wallet', 'cancelled', '2025-12-31 20:54:52', '2025-12-31 20:55:11'),
(6, 21, 18.00, 'e_wallet', 'completed', '2026-01-03 10:15:00', NULL),
(7, 22, 35.00, 'credit_card', 'completed', '2026-01-05 16:20:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `product_category` varchar(50) DEFAULT NULL,
  `product_condition` varchar(20) DEFAULT NULL,
  `product_description` text DEFAULT NULL,
  `seller_id` int(11) DEFAULT NULL,
  `seller_name` varchar(100) DEFAULT NULL,
  `seller_email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `product_name`, `product_price`, `product_category`, `product_condition`, `product_description`, `seller_id`, `seller_name`, `seller_email`) VALUES
(1, 1, 7, 'Handbag', 20.00, 'Others', 'Like New', 'Still new', 20, 'Lisa Tan', 'lisa@graduate.utm.my'),
(2, 2, 11, 'Blue Denim Jacket', 25.00, 'Fashion', 'Like New', 'Worn once. Size M.', 22, 'Sarah Chen', 'sarah@graduate.utm.my'),
(3, 3, 9, 'Graphing Calculator', 25.00, 'Electronics', 'Excellent', 'TI-84 Plus', 21, 'David Lim', 'david@graduate.utm.my'),
(4, 4, 1, 'Introduction to Algorithms', 40.00, 'Books', 'Excellent', 'Classic textbook', 13, 'Aina Zafirah', 'ainazafirah@graduate.utm.my'),
(5, 5, 12, 'Book Shelf', 30.00, 'Furniture', 'Excellent', 'Small shelf', 22, 'Sarah Chen', 'sarah@graduate.utm.my'),
(6, 6, 3, 'Programming Fundamentals Book', 18.00, 'Books', 'Good', 'For beginners', 13, 'Aina Zafirah', 'ainazafirah@graduate.utm.my'),
(7, 7, 4, 'Data Structures Textbook', 35.00, 'Books', 'Good', 'SECJ2013', 20, 'Lisa Tan', 'lisa@graduate.utm.my');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('Books','Electronics','Fashion','Furniture','Others') NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL CHECK (`price` > 0),
  `condition` enum('Like New','Excellent','Good','Fair','Poor') NOT NULL,
  `status` enum('active','sold','deleted') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `view_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `seller_id`, `name`, `category`, `description`, `price`, `condition`, `status`, `created_at`, `updated_at`, `view_count`) VALUES
(1, 13, 'Introduction to Algorithms', 'Books', 'Classic algorithms textbook, great for CS students', 40.00, 'Excellent', 'active', '2025-12-10 01:13:01', '2025-12-10 01:24:59', 5),
(2, 13, 'Computational Mathematics', 'Books', 'For Year 1 SECJH Faculty of Computing students. Minimal highlighting and notes', 15.00, 'Excellent', 'active', '2025-12-10 14:18:19', '2025-12-10 14:21:56', 3),
(3, 13, 'Programming Fundamentals Book', 'Books', 'Perfect for beginners', 18.00, 'Good', 'active', '2025-12-11 16:17:42', '2025-12-11 16:17:42', 2),
(4, 20, 'Data Structures Textbook', 'Books', 'Great condition textbook for SECJ2013', 35.00, 'Good', 'active', '2025-12-11 16:32:22', '2025-12-30 11:23:31', 7),
(5, 20, 'Scientific Calculator', 'Electronics', 'Casio fx-570ES Plus, barely used', 45.00, 'Like New', 'active', '2025-12-11 16:32:22', '2026-01-19 21:20:22', 12),
(6, 20, 'Study Desk Lamp', 'Furniture', 'LED lamp, adjustable brightness', 25.00, 'Excellent', 'active', '2025-12-11 16:32:22', '2025-12-28 23:57:10', 3),
(7, 20, 'Handbag', 'Others', 'Still new, barely used', 20.00, 'Like New', 'sold', '2025-12-16 09:23:49', '2025-12-29 16:38:39', 2),
(8, 21, 'Algorithm Design Manual', 'Books', 'Minimum highlighting and notes', 20.00, 'Good', 'active', '2025-12-12 23:31:14', '2025-12-28 23:54:53', 2),
(9, 21, 'Graphing Calculator', 'Electronics', 'TI-84 Plus, perfect for engineering students', 25.00, 'Excellent', 'sold', '2025-12-12 23:31:14', '2026-01-06 12:26:27', 4),
(10, 21, 'Wireless Mouse', 'Electronics', 'Logitech M185, works perfectly', 15.00, 'Good', 'active', '2025-12-15 10:00:00', '2025-12-15 10:00:00', 1),
(11, 22, 'Blue Denim Jacket', 'Fashion', 'Worn once. Size M. Very comfortable', 25.00, 'Like New', 'sold', '2025-12-16 09:23:49', '2025-12-29 20:50:44', 5),
(12, 22, 'Book Shelf', 'Furniture', 'Small. Great for a double room. Does not take too much space', 30.00, 'Excellent', 'active', '2025-12-16 09:23:49', '2026-01-17 11:03:31', 6),
(13, 22, 'Long Skirt Black', 'Fashion', 'Size L, elegant design', 12.00, 'Fair', 'active', '2025-12-16 09:23:49', '2025-12-16 11:07:21', 1),
(14, 23, 'Python Programming Book', 'Books', 'Learn Python from scratch', 22.00, 'Excellent', 'active', '2025-12-18 14:00:00', '2025-12-18 14:00:00', 4),
(15, 23, 'USB Hub 4-Port', 'Electronics', 'Brand new, never used', 18.00, 'Like New', 'active', '2025-12-19 15:30:00', '2026-01-19 20:09:31', 3),
(16, 24, 'Office Chair', 'Furniture', 'Ergonomic, adjustable height', 80.00, 'Good', 'active', '2025-12-20 10:00:00', '2026-01-20 00:45:02', 8),
(17, 24, 'Backpack', 'Others', 'Large capacity, perfect for students', 35.00, 'Excellent', 'active', '2025-12-21 11:00:00', '2026-01-19 19:54:53', 8),
(18, 24, 'Calculator App Guide', 'Books', 'Not used, still in wrapper', 10.00, 'Like New', 'active', '2025-12-22 12:00:00', '2026-01-19 21:32:59', 14);

--
-- Triggers `products`
--
DELIMITER $$
CREATE TRIGGER `after_product_sold` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
    IF OLD.status = 'active' AND NEW.status = 'sold' THEN
        -- 通知卖家产品已售出
        INSERT INTO notifications (user_id, sender_id, notification_type, message_preview)
        VALUES (NEW.seller_id, NEW.seller_id, 'product_sold', 
                CONCAT('Your product "', NEW.name, '" has been sold!'));
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `image_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`image_id`, `product_id`, `image_url`, `is_primary`, `created_at`) VALUES
(1, 1, '/uploads/products/algorithms.jpg', 1, '2025-12-10 01:13:01'),
(2, 2, '/uploads/products/computational-math.jpg', 1, '2025-12-10 14:18:19'),
(3, 3, '/uploads/products/programming-book.jpg', 1, '2025-12-11 16:17:42'),
(4, 4, '/uploads/products/data-structure.jpg', 1, '2025-12-11 16:45:43'),
(5, 5, '/uploads/products/calculator.jpg', 1, '2025-12-11 16:45:43'),
(6, 6, '/uploads/products/desk-lamp.jpg', 1, '2025-12-11 16:45:43'),
(7, 7, '/uploads/products/handbag.jpg', 1, '2025-12-16 09:29:27'),
(8, 8, '/uploads/products/design-manual1.jpg', 1, '2025-12-12 23:40:20'),
(9, 8, '/uploads/products/design-manual2.jpg', 0, '2025-12-12 23:40:20'),
(10, 9, '/uploads/products/graphing.jpg', 1, '2025-12-12 23:40:20'),
(11, 10, '/uploads/products/wireless-mouse.jpg', 1, '2025-12-15 10:00:00'),
(12, 11, '/uploads/products/jacket.jpg', 1, '2025-12-16 09:29:27'),
(13, 12, '/uploads/products/shelf.jpg', 1, '2025-12-16 09:29:27'),
(14, 13, '/uploads/products/skirt.jpeg', 1, '2025-12-16 09:29:27'),
(15, 14, '/uploads/products/python-book.jpg', 1, '2025-12-18 14:00:00'),
(16, 15, '/uploads/products/usb-hub.jpg', 1, '2025-12-19 15:30:00'),
(17, 16, '/uploads/products/office-chair.jpg', 1, '2025-12-20 10:00:00'),
(18, 17, '/uploads/products/backpack.jpg', 1, '2025-12-21 11:00:00'),
(19, 18, '/uploads/products/guide.jpg', 1, '2025-12-22 12:00:00');

-- --------------------------------------------------------

--
-- Stand-in structure for view `product_stats`
-- (See below for the actual view)
--
CREATE TABLE `product_stats` (
`product_id` int(11)
,`name` varchar(150)
,`category` enum('Books','Electronics','Fashion','Furniture','Others')
,`price` decimal(10,2)
,`status` enum('active','sold','deleted')
,`view_count` int(11)
,`seller_name` varchar(255)
,`interaction_count` bigint(21)
,`created_at` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `search_history`
--

CREATE TABLE `search_history` (
  `search_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `search_query` varchar(255) NOT NULL,
  `results_count` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `search_history`
--

INSERT INTO `search_history` (`search_id`, `user_id`, `search_query`, `results_count`, `created_at`) VALUES
(1, 13, 'algorithm', 2, '2025-12-12 23:47:16'),
(2, 13, 'calculator', 3, '2025-12-12 23:47:27'),
(3, 13, 'handbag', 1, '2025-12-16 09:33:53'),
(4, 20, 'books', 5, '2025-12-20 10:00:00'),
(5, 20, 'furniture', 2, '2025-12-21 11:00:00'),
(6, 21, 'electronics', 4, '2025-12-22 14:30:00'),
(7, 22, 'fashion', 2, '2025-12-23 16:00:00'),
(8, 23, 'calculator', 3, '2025-12-24 09:00:00'),
(9, 24, 'backpack', 1, '2025-12-25 10:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `user_id` int(11) NOT NULL,
  `matric` varchar(255) NOT NULL,
  `degree_type` varchar(255) NOT NULL,
  `faculty_code` varchar(255) NOT NULL,
  `enrollment_year` int(11) NOT NULL,
  `estimated_graduation_year` int(11) NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `matric_card_path` varchar(255) DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `account_status` enum('active','restricted','suspended','permanently_suspended') DEFAULT 'active',
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verification_code` varchar(6) DEFAULT NULL,
  `email_code_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`user_id`, `matric`, `degree_type`, `faculty_code`, `enrollment_year`, `estimated_graduation_year`, `reset_token`, `reset_token_expiry`, `matric_card_path`, `verification_status`, `account_status`, `name`, `phone`, `address`, `profile_image`, `email_verified`, `email_verification_code`, `email_code_expiry`) VALUES
(9, 'PCS190048', 'PhD', 'CS', 2019, 2024, NULL, NULL, NULL, 'pending', 'restricted', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(10, 'F25SP1234', 'Foundation', 'SP', 2025, 2026, NULL, NULL, NULL, 'pending', 'restricted', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(13, 'A23CS8014', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-13-1765853549493-973698491.jpg', 'verified', 'active', NULL, NULL, NULL, NULL, 1, NULL, NULL),
(14, 'A23CS0051', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-14-1765933180698-931823739.jpg', '', 'restricted', NULL, NULL, NULL, NULL, 1, NULL, NULL),
(15, 'A23CS0048', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, NULL, '', 'restricted', NULL, NULL, NULL, NULL, 1, NULL, NULL),
(16, 'A23CS5567', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-16-1734567890123-123456789.jpg', 'verified', 'restricted', 'John Doe', '+60123456789', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(17, 'A23CS4567', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-17-1734567890124-123456790.jpg', 'verified', 'suspended', 'Jane Smith', '+60123456788', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(18, 'A23CS7654', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-18-1734567890125-123456791.jpg', 'verified', 'restricted', 'Bob Wilson', '+60123456787', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(19, 'A23CS9876', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-19-1734567890126-123456792.jpg', 'verified', 'permanently_suspended', 'Alice Brown', '+60123456786', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(20, 'A23CS2001', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-20-1734567890127-123456793.jpg', 'verified', 'active', 'Lisa Tan', '+60123456785', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(21, 'A23CS2002', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-21-1734567890128-123456794.jpg', 'verified', 'active', 'David Lim', '+60123456784', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(22, 'A23CS2003', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-22-1734567890129-123456795.jpg', 'verified', 'active', 'Sarah Chen', '+60123456783', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(23, 'A23CS2004', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-23-1734567890130-123456796.jpg', 'verified', 'active', 'Michael Wong', '+60123456782', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(24, 'A23CS2005', 'Bachelor', 'CS', 2023, 2027, NULL, NULL, 'uploads\\matric-cards\\matric-24-1734567890131-123456797.jpg', 'verified', 'active', 'Emily Lee', '+60123456781', 'UTM Skudai, Johor', NULL, 1, NULL, NULL),
(25, 'AI00000', 'Bachelor', 'CS', 2026, 2030, NULL, NULL, NULL, 'verified', 'active', 'AI Shopping Assistant', NULL, NULL, NULL, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_type` enum('student','admin','system') NOT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `last_failed_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `password`, `user_type`, `failed_login_attempts`, `locked_until`, `last_login`, `last_failed_login`, `created_at`, `updated_at`) VALUES
(7, 'admin@gmail.com', '$2b$10$c6thtNCOXXYy0L4zws48Ae5KxAjsJ.yjnzn6904FfOSVMai1gzzxC', 'admin', 0, NULL, '2026-01-19 17:57:14', '2026-01-19 17:54:54', '2025-11-23 16:29:54', '2026-01-19 17:57:14'),
(9, 'tany@graduate.utm.my', '$2b$10$oWS9POuJS7WYjcZk61AYxus5XUS/xVO6mDBkRQggZVCJs.FuDPqey', 'student', 1, NULL, NULL, '2026-01-06 11:37:56', '2025-11-23 16:38:06', '2026-01-06 11:37:56'),
(10, 'test2@graduate.utm.my', '$2b$10$.Ff5LQppyms7D0qUYAMcAeJa6wu8vI4wQPEUGnkpTs2VFDtyVAgje', 'student', 0, NULL, NULL, NULL, '2025-11-23 17:52:59', '2025-11-23 17:52:59'),
(13, 'ainazafirah@graduate.utm.my', '$2b$10$fFsttPcT/mb.ttobd3dsI.ZJkCouRslIOdzClnTf/NZ2J7JThyoPi', 'student', 0, NULL, '2026-01-20 16:29:55', '2026-01-20 11:47:16', '2025-12-16 10:42:23', '2026-01-20 16:29:55'),
(14, 'asilah04@graduate.utm.my', '$2b$10$TEyF9CGBjAsbehKXioJ8TuAFjwoGrhV7YLmKUstlJUjJQKWp5M55C', 'student', 0, NULL, '2025-12-23 00:02:11', NULL, '2025-12-16 12:59:51', '2025-12-23 00:02:11'),
(15, 'angiewongsiaw@graduate.utm.my', '$2b$10$pSaTcaNfLMgIS698fcEiTeO7JQp4ohgnOc6Mi.m3VrZ7UpGYd8Kn6', 'student', 0, NULL, '2025-12-30 00:34:46', NULL, '2025-12-16 20:43:27', '2025-12-30 00:34:46'),
(16, 'johndoe@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2026-01-06 12:31:54', NULL, '2025-12-15 10:00:00', '2026-01-06 12:31:54'),
(17, 'janesmith@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2025-12-24 01:02:40', NULL, '2025-12-10 12:00:00', '2025-12-24 01:02:40'),
(18, 'bobwilson@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2025-12-24 00:21:35', NULL, '2025-12-08 09:00:00', '2025-12-24 00:21:35'),
(19, 'alicebrown@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2025-12-24 00:20:26', NULL, '2025-11-20 10:00:00', '2025-12-24 00:20:26'),
(20, 'lisa@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2026-01-12 10:00:00', NULL, '2025-11-01 10:00:00', '2026-01-12 10:00:00'),
(21, 'david@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2026-01-12 09:30:00', NULL, '2025-11-05 10:00:00', '2026-01-12 09:30:00'),
(22, 'sarah@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2026-01-12 11:00:00', NULL, '2025-11-10 10:00:00', '2026-01-12 11:00:00'),
(23, 'michael@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2026-01-12 08:45:00', NULL, '2025-11-15 10:00:00', '2026-01-12 08:45:00'),
(24, 'emily@graduate.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'student', 0, NULL, '2026-01-12 10:30:00', NULL, '2025-11-20 10:00:00', '2026-01-12 10:30:00'),
(25, 'ai.assistant@thriftin.utm.my', '$2b$10$pzV46BwLMW005doIRQXDv.Z2vTva/mzga9uuprOdGRedxVWcwmm62', 'system', 0, NULL, NULL, NULL, '2026-01-12 19:11:42', '2026-01-20 00:42:08');

-- --------------------------------------------------------

--
-- Stand-in structure for view `user_activity_summary`
-- (See below for the actual view)
--
CREATE TABLE `user_activity_summary` (
`user_id` int(11)
,`user_name` varchar(255)
,`matric` varchar(255)
,`total_interactions` bigint(21)
,`products_listed` bigint(21)
,`total_purchases` bigint(21)
,`wallet_balance` decimal(10,2)
,`last_login` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `user_interactions`
--

CREATE TABLE `user_interactions` (
  `interaction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `interaction_type` enum('view','search','click') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_interactions`
--

INSERT INTO `user_interactions` (`interaction_id`, `user_id`, `product_id`, `interaction_type`, `created_at`) VALUES
(1, 13, 4, 'view', '2025-12-11 16:32:33'),
(2, 13, 6, 'view', '2025-12-11 16:32:42'),
(3, 13, 5, 'view', '2025-12-11 16:32:44'),
(4, 13, 7, 'view', '2025-12-28 23:54:39'),
(5, 13, 11, 'view', '2025-12-29 20:07:06'),
(6, 13, 9, 'view', '2025-12-28 23:56:35'),
(7, 20, 1, 'view', '2025-12-25 13:00:00'),
(8, 20, 2, 'view', '2025-12-25 13:15:00'),
(9, 20, 12, 'view', '2025-12-30 12:00:00'),
(10, 21, 3, 'view', '2026-01-02 10:00:00'),
(11, 21, 14, 'view', '2026-01-02 10:30:00'),
(12, 22, 4, 'view', '2026-01-04 14:00:00'),
(13, 22, 5, 'view', '2026-01-04 14:30:00'),
(14, 22, 17, 'view', '2026-01-04 15:00:00'),
(15, 23, 8, 'view', '2026-01-07 09:00:00'),
(16, 23, 10, 'view', '2026-01-07 09:30:00'),
(17, 24, 13, 'view', '2026-01-08 11:00:00'),
(18, 24, 16, 'view', '2026-01-08 11:30:00'),
(19, 13, 5, 'view', '2026-01-19 16:42:15'),
(20, 13, 17, 'view', '2026-01-19 17:12:25'),
(21, 13, 18, 'view', '2026-01-19 17:13:33'),
(22, 13, 17, 'view', '2026-01-19 19:54:53'),
(23, 13, 5, 'view', '2026-01-19 20:09:21'),
(24, 13, 15, 'view', '2026-01-19 20:09:31'),
(25, 13, 5, 'view', '2026-01-19 20:10:15'),
(26, 13, 5, 'view', '2026-01-19 21:20:22'),
(27, 13, 18, 'view', '2026-01-19 21:32:59'),
(28, 13, 16, 'view', '2026-01-20 00:45:02');

-- --------------------------------------------------------

--
-- Table structure for table `user_notification_preferences`
--

CREATE TABLE `user_notification_preferences` (
  `preference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `new_messages_enabled` tinyint(1) DEFAULT 1,
  `system_updates_enabled` tinyint(1) DEFAULT 1,
  `push_enabled` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_notification_preferences`
--

INSERT INTO `user_notification_preferences` (`preference_id`, `user_id`, `new_messages_enabled`, `system_updates_enabled`, `push_enabled`, `updated_at`) VALUES
(1, 25, 1, 1, 1, '2026-01-12 11:11:42'),
(2, 13, 1, 1, 1, '2026-01-12 11:11:42'),
(3, 20, 1, 1, 1, '2026-01-12 11:11:42'),
(4, 21, 1, 1, 1, '2026-01-12 11:11:42'),
(5, 22, 1, 1, 1, '2026-01-12 11:11:42'),
(6, 23, 1, 1, 1, '2026-01-12 11:11:42'),
(7, 24, 1, 1, 1, '2026-01-12 11:11:42');

-- --------------------------------------------------------

--
-- Table structure for table `user_reports`
--

CREATE TABLE `user_reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reporter_matric` varchar(255) DEFAULT NULL,
  `reported_user_id` int(11) NOT NULL,
  `reported_matric` varchar(255) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `evidence_path` varchar(255) DEFAULT NULL,
  `evidence_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_reports`
--

INSERT INTO `user_reports` (`id`, `reporter_id`, `reporter_matric`, `reported_user_id`, `reported_matric`, `reason`, `description`, `created_at`, `updated_at`, `evidence_path`, `evidence_type`) VALUES
(1, 13, 'A23CS8014', 16, 'A23CS5567', 'Fraudulent listing - fake items', 'This user posted fraudulent listings and tried to scam me. Listed items that don\'t exist.', '2025-12-16 09:00:00', '2025-12-22 22:12:17', NULL, NULL),
(4, 13, 'A23CS8014', 17, 'A23CS4567', 'Spam listings', 'User is spamming the marketplace with duplicate listings.', '2025-12-12 08:00:00', '2025-12-24 11:04:22', 'uploads/Screenshot 2025-12-24 105815.png', 'image/png'),
(6, 13, 'A23CS8014', 18, 'A23CS7654', 'Suspicious pricing behavior', 'Items priced suspiciously low, possible counterfeit goods.', '2025-12-18 11:00:00', '2025-12-24 11:04:35', 'uploads/Screenshot 2025-12-24 105815.png', 'image/png'),
(8, 13, 'A23CS8014', 19, 'A23CS9876', 'Severe fraud', 'Collected money from multiple buyers and never delivered any items.', '2025-11-25 09:00:00', '2025-12-24 11:04:46', 'uploads/Screenshot 2025-12-24 105815.png', 'image/png');

-- --------------------------------------------------------

--
-- Table structure for table `verification_submissions`
--

CREATE TABLE `verification_submissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `extracted_matric` varchar(100) DEFAULT NULL,
  `status` enum('pending','flagged','verified','rejected') DEFAULT 'pending',
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `auto_match_success` tinyint(1) DEFAULT 0,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `verification_submissions`
--

INSERT INTO `verification_submissions` (`id`, `user_id`, `file_path`, `extracted_matric`, `status`, `reason`, `created_at`, `updated_at`, `auto_match_success`, `reviewed_by`, `reviewed_at`) VALUES
(6, 13, 'uploads\\matric-cards\\matric-13-1765853549493-973698491.jpg', 'A23CS8014', 'verified', NULL, '2025-12-16 10:53:16', '2025-12-16 12:44:39', 1, 7, '2025-12-16 12:44:39'),
(7, 14, 'uploads\\matric-cards\\matric-14-1765933180698-931823739.jpg', NULL, 'flagged', 'Cannot extract matric number', '2025-12-17 09:01:01', '2025-12-17 09:01:01', 0, NULL, NULL),
(8, 16, 'uploads\\matric-cards\\matric-16-1734567890123-123456789.jpg', 'A23CS5567', 'verified', NULL, '2025-12-15 10:30:00', '2025-12-15 11:00:00', 1, 7, '2025-12-15 11:00:00'),
(9, 17, 'uploads\\matric-cards\\matric-17-1734567890124-123456790.jpg', 'A23CS4567', 'verified', NULL, '2025-12-10 12:30:00', '2025-12-10 13:00:00', 1, 7, '2025-12-10 13:00:00'),
(10, 18, 'uploads\\matric-cards\\matric-18-1734567890125-123456791.jpg', 'A23CS7654', 'verified', NULL, '2025-12-08 09:30:00', '2025-12-08 10:00:00', 1, 7, '2025-12-08 10:00:00'),
(11, 19, 'uploads\\matric-cards\\matric-19-1734567890126-123456792.jpg', 'A23CS9876', 'verified', NULL, '2025-11-20 10:30:00', '2025-11-20 11:00:00', 1, 7, '2025-11-20 11:00:00'),
(12, 20, 'uploads\\matric-cards\\matric-20-1734567890127-123456793.jpg', 'A23CS2001', 'verified', NULL, '2025-11-01 10:30:00', '2025-11-01 11:00:00', 1, 7, '2025-11-01 11:00:00'),
(13, 21, 'uploads\\matric-cards\\matric-21-1734567890128-123456794.jpg', 'A23CS2002', 'verified', NULL, '2025-11-05 10:30:00', '2025-11-05 11:00:00', 1, 7, '2025-11-05 11:00:00'),
(14, 22, 'uploads\\matric-cards\\matric-22-1734567890129-123456795.jpg', 'A23CS2003', 'verified', NULL, '2025-11-10 10:30:00', '2025-11-10 11:00:00', 1, 7, '2025-11-10 11:00:00'),
(15, 23, 'uploads\\matric-cards\\matric-23-1734567890130-123456796.jpg', 'A23CS2004', 'verified', NULL, '2025-11-15 10:30:00', '2025-11-15 11:00:00', 1, 7, '2025-11-15 11:00:00'),
(16, 24, 'uploads\\matric-cards\\matric-24-1734567890131-123456797.jpg', 'A23CS2005', 'verified', NULL, '2025-11-20 10:30:00', '2025-11-20 11:00:00', 1, 7, '2025-11-20 11:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `wallet_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallets`
--

INSERT INTO `wallets` (`wallet_id`, `user_id`, `balance`, `created_at`, `updated_at`) VALUES
(1, 13, 75.00, '2025-12-31 20:41:24', '2026-01-06 12:26:27'),
(2, 20, 100.00, '2025-12-20 10:00:00', '2025-12-31 20:55:11'),
(3, 21, 50.00, '2025-12-22 11:00:00', '2025-12-22 11:00:00'),
(4, 22, 80.00, '2025-12-23 12:00:00', '2025-12-23 12:00:00'),
(5, 23, 60.00, '2025-12-24 13:00:00', '2025-12-24 13:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `transaction_id` int(11) NOT NULL,
  `wallet_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `transaction_type` enum('top_up','purchase','refund') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `top_up_method` enum('credit_card','e_wallet','online_banking') DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `product_name` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallet_transactions`
--

INSERT INTO `wallet_transactions` (`transaction_id`, `wallet_id`, `user_id`, `transaction_type`, `amount`, `balance_before`, `balance_after`, `top_up_method`, `order_id`, `product_name`, `description`, `transaction_date`) VALUES
(1, 1, 13, 'top_up', 50.00, 0.00, 50.00, 'credit_card', NULL, NULL, 'Topped up RM 50.00 via credit_card', '2025-12-31 20:42:38'),
(2, 1, 13, 'top_up', 50.00, 50.00, 100.00, 'e_wallet', NULL, NULL, 'Topped up RM 50.00 via e_wallet', '2026-01-06 12:25:16'),
(3, 1, 13, 'purchase', 25.00, 100.00, 75.00, NULL, 3, 'Graphing Calculator', 'Purchased \"Graphing Calculator\" for RM 25.00', '2026-01-06 12:26:27'),
(4, 2, 20, 'top_up', 100.00, 0.00, 100.00, 'online_banking', NULL, NULL, 'Topped up RM 100.00 via online_banking', '2025-12-20 10:30:00'),
(5, 2, 20, 'purchase', 30.00, 100.00, 70.00, NULL, 5, 'Book Shelf', 'Purchased \"Book Shelf\" for RM 30.00', '2025-12-31 20:54:52'),
(6, 2, 20, 'refund', 30.00, 70.00, 100.00, NULL, 5, 'Book Shelf', 'Refund for cancelled order', '2025-12-31 20:55:11'),
(7, 3, 21, 'top_up', 50.00, 0.00, 50.00, 'e_wallet', NULL, NULL, 'Topped up RM 50.00 via e_wallet', '2025-12-22 11:00:00'),
(8, 4, 22, 'top_up', 80.00, 0.00, 80.00, 'credit_card', NULL, NULL, 'Topped up RM 80.00 via credit_card', '2025-12-23 12:00:00'),
(9, 5, 23, 'top_up', 60.00, 0.00, 60.00, 'e_wallet', NULL, NULL, 'Topped up RM 60.00 via e_wallet', '2025-12-24 13:00:00');

-- --------------------------------------------------------

--
-- Structure for view `chat_activity`
--
DROP TABLE IF EXISTS `chat_activity`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `chat_activity`  AS SELECT `c`.`conversation_id` AS `conversation_id`, `u1`.`id` AS `user1_id`, `s1`.`name` AS `user1_name`, `u2`.`id` AS `user2_id`, `s2`.`name` AS `user2_name`, `c`.`is_ai_conversation` AS `is_ai_conversation`, count(`m`.`message_id`) AS `message_count`, max(`m`.`created_at`) AS `last_message_time`, `c`.`created_at` AS `conversation_started` FROM (((((`conversations` `c` join `user` `u1` on(`c`.`participant_1_id` = `u1`.`id`)) left join `students` `s1` on(`u1`.`id` = `s1`.`user_id`)) join `user` `u2` on(`c`.`participant_2_id` = `u2`.`id`)) left join `students` `s2` on(`u2`.`id` = `s2`.`user_id`)) left join `messages` `m` on(`c`.`conversation_id` = `m`.`conversation_id`)) GROUP BY `c`.`conversation_id` ;

-- --------------------------------------------------------

--
-- Structure for view `product_stats`
--
DROP TABLE IF EXISTS `product_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `product_stats`  AS SELECT `p`.`product_id` AS `product_id`, `p`.`name` AS `name`, `p`.`category` AS `category`, `p`.`price` AS `price`, `p`.`status` AS `status`, `p`.`view_count` AS `view_count`, `s`.`name` AS `seller_name`, count(distinct `ui`.`interaction_id`) AS `interaction_count`, `p`.`created_at` AS `created_at` FROM ((`products` `p` left join `students` `s` on(`p`.`seller_id` = `s`.`user_id`)) left join `user_interactions` `ui` on(`p`.`product_id` = `ui`.`product_id`)) GROUP BY `p`.`product_id` ;

-- --------------------------------------------------------

--
-- Structure for view `user_activity_summary`
--
DROP TABLE IF EXISTS `user_activity_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_activity_summary`  AS SELECT `u`.`id` AS `user_id`, `s`.`name` AS `user_name`, `s`.`matric` AS `matric`, count(distinct `ui`.`interaction_id`) AS `total_interactions`, count(distinct `p`.`product_id`) AS `products_listed`, count(distinct `o`.`order_id`) AS `total_purchases`, coalesce(`w`.`balance`,0) AS `wallet_balance`, `u`.`last_login` AS `last_login` FROM (((((`user` `u` left join `students` `s` on(`u`.`id` = `s`.`user_id`)) left join `user_interactions` `ui` on(`u`.`id` = `ui`.`user_id`)) left join `products` `p` on(`u`.`id` = `p`.`seller_id`)) left join `orders` `o` on(`u`.`id` = `o`.`buyer_id`)) left join `wallets` `w` on(`u`.`id` = `w`.`user_id`)) WHERE `u`.`user_type` = 'student' GROUP BY `u`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `admin_actions`
--
ALTER TABLE `admin_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `target_user_id` (`target_user_id`);

--
-- Indexes for table `analytics_logs`
--
ALTER TABLE `analytics_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_event_time` (`event`,`timestamp`);

--
-- Indexes for table `blocked_users`
--
ALTER TABLE `blocked_users`
  ADD PRIMARY KEY (`block_id`),
  ADD UNIQUE KEY `unique_block` (`blocker_id`,`blocked_id`),
  ADD KEY `blocked_id` (`blocked_id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`conversation_id`),
  ADD KEY `participant_1_id` (`participant_1_id`),
  ADD KEY `participant_2_id` (`participant_2_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_buyer_orders` (`buyer_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order_items` (`order_id`),
  ADD KEY `idx_product_orders` (`product_id`),
  ADD KEY `seller_id` (`seller_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `idx_seller` (`seller_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `search_history`
--
ALTER TABLE `search_history`
  ADD PRIMARY KEY (`search_id`),
  ADD KEY `idx_user_search` (`user_id`,`created_at`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_interactions`
--
ALTER TABLE `user_interactions`
  ADD PRIMARY KEY (`interaction_id`),
  ADD KEY `idx_user_interactions` (`user_id`,`created_at`),
  ADD KEY `idx_product_interactions` (`product_id`);

--
-- Indexes for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD PRIMARY KEY (`preference_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `user_reports`
--
ALTER TABLE `user_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `reported_user_id` (`reported_user_id`);

--
-- Indexes for table `verification_submissions`
--
ALTER TABLE `verification_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`wallet_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `idx_wallet_transactions` (`wallet_id`),
  ADD KEY `idx_user_transactions` (`user_id`),
  ADD KEY `idx_order_transaction` (`order_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_actions`
--
ALTER TABLE `admin_actions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `analytics_logs`
--
ALTER TABLE `analytics_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `blocked_users`
--
ALTER TABLE `blocked_users`
  MODIFY `block_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `conversation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `search_history`
--
ALTER TABLE `search_history`
  MODIFY `search_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `user_interactions`
--
ALTER TABLE `user_interactions`
  MODIFY `interaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  MODIFY `preference_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_reports`
--
ALTER TABLE `user_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `verification_submissions`
--
ALTER TABLE `verification_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `wallet_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_actions`
--
ALTER TABLE `admin_actions`
  ADD CONSTRAINT `admin_actions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_actions_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `analytics_logs`
--
ALTER TABLE `analytics_logs`
  ADD CONSTRAINT `analytics_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `analytics_logs_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL;

--
-- Constraints for table `blocked_users`
--
ALTER TABLE `blocked_users`
  ADD CONSTRAINT `blocked_users_ibfk_1` FOREIGN KEY (`blocker_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blocked_users_ibfk_2` FOREIGN KEY (`blocked_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`participant_1_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`participant_2_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `search_history`
--
ALTER TABLE `search_history`
  ADD CONSTRAINT `search_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_interactions`
--
ALTER TABLE `user_interactions`
  ADD CONSTRAINT `user_interactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_interactions_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD CONSTRAINT `user_notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_reports`
--
ALTER TABLE `user_reports`
  ADD CONSTRAINT `user_reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_reports_ibfk_2` FOREIGN KEY (`reported_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `verification_submissions`
--
ALTER TABLE `verification_submissions`
  ADD CONSTRAINT `verification_submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`wallet_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wallet_transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wallet_transactions_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
