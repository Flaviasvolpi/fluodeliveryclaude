import { Body, Controller, Post } from '@nestjs/common';
import { ClienteAuthService } from './cliente-auth.service';
import { Public } from '../common/decorators';
import {
  VerificarTelefoneDto, VerificarPinDto, CadastrarClienteDto,
  MeusPedidosDto, MeusCuponsDto, MeusEnderecosDto,
} from './dto/cliente-auth.dto';

@Public()
@Controller('v1/cliente-auth')
export class ClienteAuthController {
  constructor(private service: ClienteAuthService) {}

  @Post('verificar-telefone')
  verificarTelefone(@Body() dto: VerificarTelefoneDto) {
    return this.service.verificarTelefone(dto.empresaId, dto.telefone);
  }

  @Post('verificar')
  verificarPin(@Body() dto: VerificarPinDto) {
    return this.service.verificarPin(dto.empresaId, dto.telefone, dto.pin);
  }

  @Post('cadastrar')
  cadastrar(@Body() dto: CadastrarClienteDto) {
    return this.service.cadastrar(dto.empresaId, dto.telefone, dto.nome, dto.pin);
  }

  @Post('meus-pedidos')
  meusPedidos(@Body() dto: MeusPedidosDto) {
    return this.service.meusPedidos(dto.clienteId, dto.empresaId);
  }

  @Post('meus-cupons')
  meusCupons(@Body() dto: MeusCuponsDto) {
    return this.service.meusCupons(dto.clienteId, dto.empresaId);
  }

  @Post('meus-enderecos')
  meusEnderecos(@Body() dto: MeusEnderecosDto) {
    return this.service.meusEnderecos(dto.clienteId, dto.empresaId, dto.action, dto.endereco);
  }
}
