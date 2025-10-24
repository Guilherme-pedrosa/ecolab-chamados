CREATE TABLE `chamados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroOS` varchar(20) NOT NULL,
	`dataOS` timestamp NOT NULL,
	`distrito` varchar(10),
	`nomeGT` varchar(100),
	`codCliente` varchar(20),
	`cliente` text,
	`nomeTRA` varchar(100),
	`status` enum('aberto','em_andamento','fechado') NOT NULL DEFAULT 'aberto',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `chamados_id` PRIMARY KEY(`id`),
	CONSTRAINT `chamados_numeroOS_unique` UNIQUE(`numeroOS`)
);
--> statement-breakpoint
CREATE TABLE `evolucoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chamadoId` int NOT NULL,
	`descricao` text NOT NULL,
	`statusAnterior` enum('aberto','em_andamento','fechado'),
	`statusNovo` enum('aberto','em_andamento','fechado'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `evolucoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_chamadoId_chamados_id_fk` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolucoes` ADD CONSTRAINT `evolucoes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;