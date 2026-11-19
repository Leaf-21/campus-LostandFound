-- AlterTable
ALTER TABLE `posts` ADD COLUMN `previous_status` ENUM('OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED', 'HIDDEN') NULL;

-- CreateTable
CREATE TABLE `admin_actions` (
    `id` CHAR(36) NOT NULL,
    `admin_id` CHAR(36) NOT NULL,
    `target_type` VARCHAR(30) NOT NULL,
    `target_id` CHAR(36) NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `reason` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_actions_target_type_target_id_created_at_idx`(`target_type`, `target_id`, `created_at`),
    INDEX `admin_actions_admin_id_created_at_idx`(`admin_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_actions` ADD CONSTRAINT `admin_actions_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
