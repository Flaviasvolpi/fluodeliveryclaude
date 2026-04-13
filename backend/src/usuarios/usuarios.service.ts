import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRoleDto, CreateUsuarioDto, UpdateRolesDto } from './dto/usuarios.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll(empresaId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { empresaId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    // Group by user
    const userMap = new Map<string, { user_id: string; email: string; nome: string; roles: { role_id: string; role: string }[] }>();
    for (const r of roles) {
      if (!userMap.has(r.user.id)) {
        userMap.set(r.user.id, {
          user_id: r.user.id,
          email: r.user.email,
          nome: r.user.fullName || '',
          roles: [],
        });
      }
      userMap.get(r.user.id)!.roles.push({ role_id: r.id, role: r.role });
    }
    return Array.from(userMap.values());
  }

  async createUsuario(empresaId: string, dto: CreateUsuarioDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email.toLowerCase(), password: hashedPassword, fullName: dto.nome },
    });

    // Assign roles
    if (dto.roles?.length) {
      for (const role of dto.roles) {
        await this.prisma.userRole.create({
          data: { userId: user.id, role: role as any, empresaId },
        });
      }
    }

    return { user_id: user.id, email: user.email, nome: user.fullName };
  }

  async updateRoles(empresaId: string, dto: UpdateRolesDto) {
    // Remove all existing roles for this user in this empresa
    await this.prisma.userRole.deleteMany({ where: { userId: dto.userId, empresaId } });

    // Add new roles
    for (const role of dto.roles) {
      await this.prisma.userRole.create({
        data: { userId: dto.userId, role: role as any, empresaId },
      });
    }

    return { success: true };
  }

  async removeUsuario(empresaId: string, userId: string) {
    // Remove all roles for this user in this empresa
    await this.prisma.userRole.deleteMany({ where: { userId, empresaId } });
    return { success: true };
  }

  assignRole(empresaId: string, dto: AssignRoleDto) {
    return this.prisma.userRole.create({
      data: { userId: dto.userId, role: dto.role, empresaId },
    });
  }

  deleteRole(id: string, empresaId: string) {
    return this.prisma.userRole.delete({ where: { id, empresaId } });
  }
}
