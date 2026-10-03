ALTER TABLE `employees`
  ADD COLUMN `contractType` enum('permanent','temporary','apprentice','part_time') DEFAULT 'permanent',
  ADD COLUMN `baseSalary` decimal(10,2),
  ADD COLUMN `currency` varchar(3) DEFAULT 'BRL',
  ADD COLUMN `version` int DEFAULT 1,
  ADD COLUMN `createdBy` int,
  ADD COLUMN `updatedBy` int,
  ADD COLUMN `deletedAt` timestamp;
