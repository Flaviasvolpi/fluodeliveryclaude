import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, CreateEnderecoDto, UpdateEnderecoDto } from './dto/clientes.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/clientes')
export class ClientesController {
  constructor(private service: ClientesService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  findOne(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateClienteDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }

  // --- Enderecos nested ---

  @Get(':clienteId/enderecos')
  findEnderecos(@Param('empresaId') empresaId: string, @Param('clienteId') clienteId: string) {
    return this.service.findEnderecos(clienteId, empresaId);
  }

  @Post(':clienteId/enderecos')
  @Roles('admin')
  createEndereco(
    @Param('empresaId') empresaId: string,
    @Param('clienteId') clienteId: string,
    @Body() dto: CreateEnderecoDto,
  ) {
    return this.service.createEndereco(clienteId, empresaId, dto);
  }

  @Patch(':clienteId/enderecos/:enderecoId')
  @Roles('admin')
  updateEndereco(
    @Param('empresaId') empresaId: string,
    @Param('enderecoId') enderecoId: string,
    @Body() dto: UpdateEnderecoDto,
  ) {
    return this.service.updateEndereco(enderecoId, empresaId, dto);
  }

  @Delete(':clienteId/enderecos/:enderecoId')
  @Roles('admin')
  deleteEndereco(@Param('empresaId') empresaId: string, @Param('enderecoId') enderecoId: string) {
    return this.service.deleteEndereco(enderecoId, empresaId);
  }
}
