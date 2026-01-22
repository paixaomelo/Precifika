/**
 * PrecifiKa - Sistema de Inteligência de Preços
 * Developed for Angolan Market
 */

const app = {
    data: {
        productName: '',
        type: 'product',
        capacity: 0,
        minQty: 1,
        variableUnitCost: 0, // New field for direct unit cost
        costs: [],
        totalFixedCost: 0,
        totalCost: 0,
        unitCost: 0,
        marketPrices: [],
        marketAvg: 0,
        selectedIdealPrice: 0,
        selectedProfit: 0
    },

    init: function () {
        console.log("PrecifiKa initialized - AO Version");
        this.renderDefaultCosts();
    },

    // --- UI Helpers ---

    scrollToSection: function (id) {
        const element = document.getElementById(id);
        const yOffset = -80; // Navbar offset
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    },

    // --- Step 1: Data Collection ---

    renderDefaultCosts: function () {
        const defaultCosts = [
            'Frete / Importação / Transporte',
            'Impostos de Alfândega / Taxas',
            'Aluguel de Armazém / Loja',
            'Salários da Equipe',
            'Marketing / Anúncios',
            'Embalagens de Envio',
            'Outros Custos Fixos'
        ];

        const container = document.getElementById('costsContainer');
        container.innerHTML = '';

        defaultCosts.forEach((desc) => {
            this.addCostFieldInternal(container, desc);
        });
    },

    addCostField: function () {
        const container = document.getElementById('costsContainer');
        this.addCostFieldInternal(container, '', true);
    },

    addCostFieldInternal: function (container, description = '', isFocus = false) {
        const div = document.createElement('div');
        div.className = 'row g-2 cost-item align-items-center mb-2';
        div.innerHTML = `
            <div class="col-7 col-md-8">
                <input type="text" class="form-control form-control-sm cost-desc" placeholder="Descrição da despesa" value="${description}">
            </div>
            <div class="col-4 col-md-3">
                <div class="input-group input-group-sm">
                    <span class="input-group-text">Kz</span>
                    <input type="number" class="form-control cost-value" placeholder="0.00" step="0.01">
                </div>
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn btn-link text-muted p-0" onclick="this.closest('.cost-item').remove()"><i class="fa-solid fa-times"></i></button>
            </div>
        `;
        container.appendChild(div);
        if (isFocus) div.querySelector('.cost-desc').focus();
    },

    goToStep2: function () {
        // Collect Data
        this.data.productName = document.getElementById('productName').value;
        this.data.type = document.getElementById('productType').value;
        this.data.capacity = parseFloat(document.getElementById('totalCapacity').value) || 0;
        this.data.variableUnitCost = parseFloat(document.getElementById('unitVariableCost').value) || 0;
        this.data.minQty = parseFloat(document.getElementById('minSaleQty').value) || 1;

        if (!this.data.productName || this.data.capacity <= 0) {
            alert("Por favor, preencha o nome e a quantidade total do lote corretamente.");
            return;
        }

        // Collect Fixed Costs
        this.data.costs = [];
        let totalFixed = 0;
        const costRows = document.querySelectorAll('.cost-item');
        costRows.forEach(row => {
            const desc = row.querySelector('.cost-desc').value;
            const val = parseFloat(row.querySelector('.cost-value').value) || 0;
            if (val > 0) {
                this.data.costs.push({ desc, val });
                totalFixed += val;
            }
        });

        this.data.totalFixedCost = totalFixed;

        // --- NEW LOGIC ---
        // Total Cost = (Capacity * Variable Unit Cost) + Total Fixed Costs
        const variableTotal = this.data.capacity * this.data.variableUnitCost;
        this.data.totalCost = variableTotal + totalFixed;

        // Unit Cost = Total Cost / Capacity
        this.data.unitCost = this.data.totalCost / this.data.capacity;

        if (this.data.unitCost <= 0) {
            alert("O custo final deu zero. Verifique seus custos e quantidade.");
            return;
        }

        // Render Step 2
        document.getElementById('displayTotalCost').innerText = this.formatCurrency(this.data.totalCost);
        document.getElementById('displayUnitCost').innerText = this.formatCurrency(this.data.unitCost);

        // Default Ideal Margin 50% just for display
        const idealPrice = this.data.unitCost * 1.5;
        document.getElementById('displayIdealPrice').innerText = this.formatCurrency(idealPrice);

        // Show Next Section
        const step2 = document.getElementById('step-2');
        step2.classList.remove('d-none');
        step2.classList.add('animate-in');
        this.scrollToSection('step-2');
    },

    goToStep3: function () {
        const step3 = document.getElementById('step-3');
        step3.classList.remove('d-none');
        step3.classList.add('animate-in');
        this.scrollToSection('step-3');
    },

    goToStep4: function () {
        // Analyze Market
        const competitorInputs = document.querySelectorAll('.competitor-price');
        const prices = [];
        competitorInputs.forEach(input => {
            const p = parseFloat(input.value);
            if (!isNaN(p)) prices.push(p);
        });

        if (prices.length < 1) {
            alert("Insira pelo menos 1 preço de concorrente para referência de mercado.");
            return;
        }

        this.data.marketPrices = prices;
        const sum = prices.reduce((a, b) => a + b, 0);
        this.data.marketAvg = sum / prices.length;
        const minMarket = Math.min(...prices);
        const maxMarket = Math.max(...prices);

        // Show Analysis
        const resultDiv = document.getElementById('marketAnalysisResult');
        resultDiv.classList.remove('d-none');

        let analysisHTML = `<h6 class="fw-bold mb-2 text-primary">Diagnóstico de Mercado</h6>
                            <p class="mb-2">Média da Concorrência: <strong>${this.formatCurrency(this.data.marketAvg)}</strong></p>
                            <p class="small text-muted mb-0">Faixa de preços encontrada: ${this.formatCurrency(minMarket)} - ${this.formatCurrency(maxMarket)}</p>`;

        const myIdealCost = this.data.unitCost * 1.5;

        // Add visual cues to analysis
        if (myIdealCost < minMarket) {
            analysisHTML += `<div class="mt-3 p-2 bg-success-subtle text-green rounded border border-success"><i class="fa-solid fa-check-circle me-2"></i><strong>Excelente Competitividade!</strong> Seus custos permitem margens altas mesmo abaixo do preço médio.</div>`;
        } else if (myIdealCost > maxMarket) {
            analysisHTML += `<div class="mt-3 p-2 bg-warning-subtle text-warning-emphasis rounded border border-warning"><i class="fa-solid fa-triangle-exclamation me-2"></i><strong>Alerta de Custo:</strong> Seus custos exigem um preço acima do teto do mercado. Foque em diferenciação ou redução de despesas.</div>`;
        } else {
            analysisHTML += `<div class="mt-3 p-2 bg-light text-secondary rounded border"><i class="fa-solid fa-scale-balanced me-2"></i><strong>Competitividade Média:</strong> Seus custos estão alinhados. A diferença será sua marca e qualidade.</div>`;
        }

        resultDiv.innerHTML = analysisHTML;

        this.generateStrategies();

        const step4 = document.getElementById('step-4');
        step4.classList.remove('d-none');
        step4.classList.add('animate-in');
        setTimeout(() => this.scrollToSection('step-4'), 200);
    },

    getDiagnosis: function (price, cost, marketAvg) {
        const margin = ((price - cost) / price) * 100;

        let label = "";
        let style = "";

        if (price < cost) {
            return { label: "VENDA COM PREJUÍZO", style: "bg-danger text-white" };
        }
        if (margin < 20) {
            return { label: "MARGEM DE RISCO", style: "bg-warning text-dark" };
        }
        if (margin >= 50) {
            return { label: "ALTA LUCRATIVIDADE", style: "bg-success text-white" };
        }
        return { label: "LUCRO SAUDÁVEL", style: "bg-primary text-white" };
    },

    generateStrategies: function () {
        const cost = this.data.unitCost;

        // 1. Entry Price (Low Margin, Volume)
        const priceEntry = cost * 1.25; // 25% Markup

        // 2. Ideal Price (Balanced)
        // Aim for 50% margin OR match market avg if feasible
        let priceIdeal = Math.max(cost * 1.50, this.data.marketAvg);

        // 3. Premium Price
        const pricePremium = priceIdeal * 1.40;

        const strategies = [
            {
                title: "Preço de Entrada",
                price: priceEntry,
                desc: "<strong>Cenário:</strong> Entrada no mercado ou liquidação.<br>Use para ganhar tração rápida e volume, aceitando uma margem menor nas primeiras vendas.",
                icon: "fa-bolt",
                cssClass: ""
            },
            {
                title: "Preço Ideal",
                price: priceIdeal,
                desc: "<strong>Cenário:</strong> Crescimento Sustentável.<br>O ponto perfeito entre lucro real e competitividade. Fundo para reinvestir no negócio.",
                icon: "fa-scale-balanced",
                recommended: true,
                cssClass: "text-gold"
            },
            {
                title: "Oferta Premium",
                price: pricePremium,
                desc: "<strong>Cenário:</strong> Marca Forte ou Escassez.<br>Use quando seu produto tem alto valor percebido, exclusividade ou atendimento VIP.",
                icon: "fa-gem",
                cssClass: "text-success"
            }
        ];

        const container = document.getElementById('strategyCards');
        container.innerHTML = '';

        strategies.forEach(s => {
            const margin = ((s.price - cost) / s.price) * 100;
            const profit = s.price - cost;
            const diagnosis = this.getDiagnosis(s.price, cost, this.data.marketAvg);

            let recommendedClass = s.recommended ? 'recommended' : '';
            let btnClass = s.recommended ? 'btn-primary' : 'btn-outline-secondary';
            let iconColor = s.cssClass || 'text-muted';

            // Recommended specific styling
            let badge = s.recommended ?
                `<div class="position-absolute top-0 end-0 m-3"><span class="badge bg-gold text-dark"><i class="fa-solid fa-star me-1"></i>RECOMENDADO</span></div>` : '';

            const html = `
                <div class="col-md-4 h-100">
                    <div class="strategy-card ${recommendedClass} d-flex flex-column">
                        ${badge}
                        <div class="text-center mb-3">
                            <i class="fa-solid ${s.icon} fa-2x ${iconColor} mb-3 opacity-75"></i>
                            <h3 class="strategy-title">${s.title}</h3>
                            <div class="strategy-price font-numeric">${this.formatCurrency(s.price)}</div>
                             <span class="diagnosis-badge ${diagnosis.style}">${diagnosis.label}</span>
                        </div>
                        
                        <div class="strategy-desc text-center flex-grow-1 border-top pt-3 mt-2">
                            ${s.desc}
                        </div>

                        <div class="bg-light p-3 rounded mt-3">
                            <div class="d-flex justify-content-between mb-1 small">
                                <span class="text-muted">Lucro Unitário:</span>
                                <span class="fw-bold text-success font-numeric">${this.formatCurrency(profit)}</span>
                            </div>
                            <div class="d-flex justify-content-between small">
                                <span class="text-muted">Margem Bruta:</span>
                                <span class="fw-bold">${margin.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });

        // Set default selection
        this.data.selectedIdealPrice = priceIdeal;
        this.data.selectedProfit = priceIdeal - cost;
    },

    goToStep5: function () {
        const step5 = document.getElementById('step-5');
        step5.classList.remove('d-none');
        step5.classList.add('animate-in');
        this.scrollToSection('step-5');
    },

    calculatePlan: function () {
        const days = parseInt(document.getElementById('salesDays').value) || 30;
        const targetProfit = parseFloat(document.getElementById('profitTarget').value) || 0;

        if (targetProfit <= 0) return;

        const profitPerUnit = this.data.selectedProfit;
        const totalUnitsNeeded = Math.ceil(targetProfit / profitPerUnit);
        const unitsPerDay = Math.max(1, Math.ceil(totalUnitsNeeded / days));

        // Revenue needed = Total Units * Price
        // But more simply: Cost + Profit Target also roughly equals Revenue, but clearer is:
        const totalRevenue = totalUnitsNeeded * this.data.selectedIdealPrice;

        const resultDiv = document.getElementById('salesPlanResult');
        resultDiv.classList.remove('d-none');

        resultDiv.innerHTML = `
            <div class="alert bg-white border mt-4 shadow-sm animate-in">
                <h4 class="h5 mb-3 text-success fw-bold"><i class="fa-solid fa-check-circle me-2"></i>Caminho para o Lucro</h4>
                
                <div class="row text-center g-3">
                    <div class="col-md-4">
                        <div class="p-3 bg-light rounded h-100">
                            <div class="display-6 fw-bold text-dark font-numeric">${totalUnitsNeeded}</div>
                            <div class="text-muted small text-uppercase">Vendas Totais</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 bg-light rounded h-100 border border-success border-2">
                            <div class="display-6 fw-bold text-success font-numeric">${unitsPerDay}</div>
                            <div class="text-muted small text-uppercase">Vendas/Dia</div>
                            <div class="badge bg-success mt-2">META DIÁRIA</div>
                        </div>
                    </div>
                     <div class="col-md-4">
                        <div class="p-3 bg-light rounded h-100">
                            <div class="h3 fw-bold text-secondary font-numeric mt-2">${this.formatCurrency(totalRevenue)}</div>
                            <div class="text-muted small text-uppercase">Faturamento Necessário</div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-gold-subtle rounded border border-warning">
                    <i class="fa-solid fa-lightbulb text-warning me-2"></i>
                    <strong>Dica de Growth:</strong> Para atingir <strong>${unitsPerDay} vendas/dia</strong>, você precisa falar com aproximadamente <strong>${unitsPerDay * 5} pessoas</strong> diariamente (considerando taxa de conversão de 20%).
                </div>
            </div>
        `;
    },

    formatCurrency: function (value) {
        // Angolan Kwanza formatting
        return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }).replace('AOA', 'Kz');
    },

    generateReport: function () {
        const d = new Date();
        const dateStr = d.toLocaleDateString('pt-AO') + ' às ' + d.toLocaleTimeString('pt-AO');

        // Build Fixed Costs List
        let costsListHTML = '<ul style="list-style: none; padding-left: 0;">';
        this.data.costs.forEach(c => {
            costsListHTML += `<li style="margin-bottom: 5px; border-bottom: 1px dotted #ccc; display: flex; justify-content: space-between;">
                <span>${c.desc}</span>
                <strong>${this.formatCurrency(c.val)}</strong>
            </li>`;
        });
        costsListHTML += '</ul>';

        // Strategy Info - Find selected
        // Note: In a real app we would track exactly which card was clicked. 
        // For now we assume "Preço Ideal" or fallback to the data.
        const strategyPrice = this.data.selectedIdealPrice;
        const profit = this.data.selectedProfit;

        const reportHTML = `
            <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 2px solid #0F3D2E; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #0F3D2E; margin: 0;">PRECIFIKA</h1>
                    <p style="color: #666; font-size: 0.9em; letter-spacing: 2px; text-transform: uppercase;">Relatório de Estoque e Preço</p>
                </div>

                <div class="report-section">
                    <h3 style="color: #0F3D2E; border-left: 5px solid #C9A24D; padding-left: 10px;">1. Dados da Mercadoria</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <div><strong>Produto:</strong><br>${this.data.productName}</div>
                        <div><strong>Tipo:</strong><br>${this.data.type === 'product' ? 'Produto Físico' : 'Serviço'}</div>
                        <div><strong>Tamanho do Lote:</strong><br>${this.data.capacity} unidades</div>
                        <div><strong>Preço de Custo (Un):</strong><br>${this.formatCurrency(this.data.variableUnitCost)}</div>
                    </div>
                </div>

                <div class="report-section">
                    <h3 style="color: #0F3D2E; border-left: 5px solid #C9A24D; padding-left: 10px;">2. Composição de Custos</h3>
                    <p style="color: #666; font-size: 0.9em;">Despesas do Lote / Mensais:</p>
                    ${costsListHTML}
                    <div style="text-align: right; margin-top: 10px; font-size: 1.1em;">
                        Custo Fixo Rateado Total: <strong>${this.formatCurrency(this.data.totalFixedCost)}</strong>
                    </div>
                    <hr>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Custo Final com Rateio (Unidade):</span>
                            <strong style="color: #dc3545;">${this.formatCurrency(this.data.unitCost)}</strong>
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h3 style="color: #0F3D2E; border-left: 5px solid #C9A24D; padding-left: 10px;">3. Inteligência de Mercado</h3>
                    <p>Média da Concorrência: <strong>${this.formatCurrency(this.data.marketAvg)}</strong></p>
                    <p style="font-style: italic; color: #666;">Seu custo base representa ${((this.data.unitCost / this.data.marketAvg) * 100).toFixed(1)}% do preço médio do mercado.</p>
                </div>

                <div class="report-section">
                    <h3 style="color: #0F3D2E; border-left: 5px solid #C9A24D; padding-left: 10px;">4. Estratégia Definida</h3>
                    <div style="background: #0F3D2E; color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <span style="display: block; font-size: 0.9em; opacity: 0.8;">PREÇO DE VENDA SUGERIDO</span>
                        <span style="display: block; font-size: 2.5em; font-weight: bold; margin: 10px 0;">${this.formatCurrency(strategyPrice)}</span>
                        <div style="display: flex; justify-content: center; gap: 30px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
                            <div>Lucro/Unidade: <strong style="color: #C9A24D;">${this.formatCurrency(profit)}</strong></div>
                            <div>Margem: <strong>${(((strategyPrice - this.data.unitCost) / strategyPrice) * 100).toFixed(0)}%</strong></div>
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h3 style="color: #0F3D2E; border-left: 5px solid #C9A24D; padding-left: 10px;">5. Plano de Execução</h3>
                    <p>Para liquidar este lote, siga este ritmo:</p>
                    <div style="border: 2px dashed #0F3D2E; padding: 15px; text-align: center; margin-top: 10px;">
                        <strong style="font-size: 1.2em; color: #0F3D2E;">META DIÁRIA</strong><br>
                        Vender <strong>${document.querySelector('#salesPlanResult .display-6.text-success') ? document.querySelector('#salesPlanResult .display-6.text-success').innerText : '-'}</strong> unidades por dia.
                    </div>
                </div>

                <div style="margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                    <p style="font-size: 0.8em; color: #999;">Relatório gerado em ${dateStr}</p>
                </div>
            </div>
        `;

        const reportContainer = document.getElementById('printable-report');
        reportContainer.innerHTML = reportHTML;

        // Give a small delay for image rendering if any (no images here though)
        setTimeout(() => window.print(), 500);
    }
};

window.onload = function () {
    app.init();
};
