import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, CreateEnderecoDto, UpdateEnderecoDto } from './dto/clientes.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.cliente.findMany({
      where: { empresaId },
      include: { enderecos: true },
      orderBy: { nome: 'asc' },
    });
  }

  findOne(id: string, empresaId: string) {
    return this.prisma.cliente.findFirst({
      where: { id, empresaId },
      include: { enderecos: true },
    });
  }

  create(empresaId: string, dto: CreateClienteDto) {
    const { enderecos, ...data } = dto;
    return this.prisma.cliente.create({
      data: {
        ...data,
        empresaId,
        enderecos: enderecos?.length
          ? { create: enderecos.map((e) => ({ ...e, empresaId })) }
          : undefined,
      },
      include: { enderecos: true },
    });
  }

  update(id: string, empresaId: string, dto: UpdateClienteDto) {
    return this.prisma.cliente.update({
      where: { id, empresaId },
      data: dto,
      include: { enderecos: true },
    });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.cliente.delete({ where: { id, empresaId } });
  }

  // --- Enderecos nested ---

  findEnderecos(clienteId: string, empresaId: string) {
    return this.prisma.clienteEndereco.findMany({
      where: { clienteId, empresaId },
    });
  }

  createEndereco(clienteId: string, empresaId: string, dto: CreateEnderecoDto) {
    return this.prisma.clienteEndereco.create({
      data: { ...dto, clienteId, empresaId },
    });
  }

  updateEndereco(id: string, empresaId: string, dto: UpdateEnderecoDto) {
    return this.prisma.clienteEndereco.update({
      where: { id, empresaId },
      data: dto,
    });
  }

  deleteEndereco(id: string, empresaId: string) {
    return this.prisma.clienteEndereco.delete({ where: { id, empresaId } });
  }
}
