CREATE UNIQUE INDEX IF NOT EXISTS `userTenantRoles_user_tenant_unique` ON `userTenantRoles` (`userId`, `tenantId`);
