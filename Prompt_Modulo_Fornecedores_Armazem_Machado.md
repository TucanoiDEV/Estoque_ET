# Especificação -- Módulo de Fornecedores (Armazém Machado)

## Objetivo

Transformar a aba **Configurações \> Fornecedores** em um módulo
completo de gestão de fornecedores, mantendo a tabela principal simples
e utilizando Drawer ou Modal para exibir informações detalhadas.

## Tabela Principal

Manter apenas:

-   Nome da empresa
-   Representante
-   Prazo médio de entrega
-   Condição principal de pagamento
-   Status (Ativo/Inativo)
-   Ações (Editar e Excluir)

### Funcionalidades

-   Busca por fornecedor
-   Filtro por status
-   Ordenação por nome
-   Paginação

------------------------------------------------------------------------

## Cadastro Completo do Fornecedor

### Aba: Dados Básicos

Campos: - Nome da empresa - Nome do representante - CNPJ - Inscrição
Estadual - Telefone - WhatsApp - E-mail - Site - Status (Ativo/Inativo)

Validações: - Máscara de CNPJ - Máscara de telefone - Validação de
e-mail

------------------------------------------------------------------------

### Aba: Endereço

Campos: - CEP - Rua - Número - Complemento - Bairro - Cidade - Estado

Desejável: - Busca automática de endereço pelo CEP

------------------------------------------------------------------------

### Aba: Comercial

Campos: - Prazo médio de entrega (dias) - Condição de pagamento - À
vista - 7 dias - 15 dias - 30 dias - 30/60 dias - 30/60/90 dias

Outros campos: - Pedido mínimo - Valor mínimo de compra - Desconto
padrão (%) - Tipo de frete - CIF - FOB - Frete grátis - A combinar -
Frete grátis acima de R\$

------------------------------------------------------------------------

### Aba: Produtos Fornecidos

Criar relacionamento entre produtos e fornecedores.

Tabela: - Produto - Último preço pago - Última compra

Funcionalidades: - Vincular produto ao fornecedor - Remover vínculo -
Pesquisar produto - Mostrar histórico do último preço pago

------------------------------------------------------------------------

### Aba: Indicadores

Exibir métricas automáticas:

-   Total comprado
-   Número de compras
-   Ticket médio
-   Última compra
-   Prazo médio real de entrega
-   Índice de cumprimento de prazo

------------------------------------------------------------------------

### Aba: Observações

Campo de texto longo para observações internas.

Exemplos: - Entrega apenas pela manhã - Frete grátis acima de R\$
1.000 - Representante responde rapidamente pelo WhatsApp - Fornecedor
preferencial

------------------------------------------------------------------------

## Melhorias Visuais

Seguir o padrão visual atual do sistema:

-   Tema dark
-   Cards modernos
-   Bordas suaves
-   Ícones Lucide React

Ícones sugeridos: - Building2 - User - Phone - Truck - Package -
MapPin - DollarSign - FileText

------------------------------------------------------------------------

## Funcionalidade Extra

Ao abrir um produto no estoque, exibir:

-   Fornecedor principal
-   Fornecedor secundário
-   Último preço pago
-   Última compra

Objetivo: facilitar a reposição de estoque.

------------------------------------------------------------------------

## Resultado Esperado

Criar um módulo profissional de fornecedores com:

-   Cadastro completo
-   Endereço
-   Dados comerciais
-   Produtos vinculados
-   Indicadores
-   Observações
-   Interface moderna
-   Experiência consistente com o Armazém Machado
