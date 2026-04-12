import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRoleDto } from './dto/usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.userRole.findMany({
      where: { empresaId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
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
