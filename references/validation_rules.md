# Carpetify — Cross-Module Validation Rules

> Source: Lineamientos EFICINE Producción enero 2026 + Reglas Generales DOF 23-dic-2025

These rules run AFTER all modules are populated and BEFORE the export manager compiles the final package. Each rule is either a **BLOCKER** (stops export) or a **WARNING** (flagged but exportable).

---

## 1. FINANCIAL RECONCILIATION (BLOCKER)

The "golden equation" — four numbers that MUST be identical:

```
presupuesto_resumen.total == presupuesto_desglose.total == flujo_efectivo.total == esquema_financiero.total
```

If any of these differ by even $1 MXN, the project is rejected.

### 1.1 Budget ↔ Cash Flow
- Every account in A9a (resumen) must appear in A9d (flujo de efectivo)
- Sum of each account across all sources and stages in flujo must equal the account subtotal in resumen
- Sum of each source across all accounts in flujo must equal that source's total in esquema financiero

### 1.2 EFICINE Compliance
```python
assert eficine_request <= 0.80 * total_budget       # Max 80%
assert eficine_request <= 25_000_000                 # Max $25M MXN (2026)
assert erpi_contribution >= 0.20 * total_budget      # Min 20%
assert sum(all_federal_sources) <= 0.80 * total_budget  # All federal ≤ 80%
```

### 1.3 Screenwriter Payment (The 3% Rule)
```python
screenwriter_fee = c2b.monto_total_guion_con_iva
minimum_3_pct = total_budget * 0.03
# Note: may be capped at 3% of prior-year average EFICINE project cost (published by IMCINE)
assert screenwriter_fee >= minimum_3_pct

# The 3% is ONLY for final screenplay authorship
# Excluded from 3% calculation: adaptation rights, script doctor, consultants, translations, readings
```

### 1.4 In-Kind Contribution Caps
```python
total_inkind_honorarios = sum(all in-kind honorario contributions)
assert total_inkind_honorarios <= 0.10 * total_budget    # Max 10% of total budget

for person in all_inkind_contributors:
    assert person.inkind_amount <= 0.50 * person.total_fee  # Max 50% of their total fee
```

### 1.5 Gestor de Recursos Cap
```python
if eficine_request > 10_000_000:
    assert gestor_fee <= 0.04 * eficine_request   # Max 4% if EFICINE > $10M
else:
    assert gestor_fee <= 0.05 * eficine_request   # Max 5% if EFICINE ≤ $10M
# Gestor payment must come from ERPI's own contribution, NOT from EFICINE funds
```

---

## 2. TITLE CONSISTENCY (BLOCKER)

The project title must be IDENTICAL (character-for-character) across:
- SHCP online system registration
- A1 Resumen Ejecutivo
- A3 Guion (title page)
- B3 Contracts (producer and director)
- C2a INDAUTOR certificate
- C2b Cesión de derechos contract
- C4 Ficha Técnica
- D1 Insurance quote
- D1 CPA quote
- E1 Esquema Financiero
- E2 Carta de Aportación Exclusiva
- E3/E4 All third-party/coproducer contracts

Any mismatch = rejection.

---

## 3. FEE CROSS-MATCHING (BLOCKER)

### 3.1 Producer Fee Triple-Match
```
B3_contrato_productor.honorarios.monto == A9b_desglose.honorarios_produccion == A9d_flujo.honorarios_produccion
```

### 3.2 Director Fee Triple-Match
```
B3_contrato_director.honorarios.monto == A9b_desglose.honorarios_direccion == A9d_flujo.honorarios_direccion
```

### 3.3 Screenwriter Fee Quadruple-Match
```
C2b_cesion.monto_total_guion == A9b_desglose.honorarios_guion == A9d_flujo.honorarios_guion == E1_esquema (if listed separately)
```

### 3.4 Insurance + CPA Quote Match
```
D1_seguro.monto == A9b_desglose.cuenta_seguros
D1_contador.monto == A9b_desglose.honorarios_auditoria
```

---

## 4. DATE COMPLIANCE (BLOCKER)

All supporting documents must have issue dates **no more than 3 months** before the registration period close date.

```python
registration_close = date(2026, 2, 13)  # Period 1
# OR
registration_close = date(2026, 7, 15)  # Period 2

three_months_before = registration_close - timedelta(days=90)

for doc in [insurance_quote, cpa_quote, bank_statements, bank_letters, 
            third_party_support_letters, in_kind_quotes]:
    assert doc.issue_date >= three_months_before
```

---

## 5. EXPERIENCE THRESHOLDS (BLOCKER)

### 5.1 Producer
```python
if genre in ["Ficción", "Documental"]:
    features_exhibited = count(producer.filmography where tipo=="Largometraje" and exhibited==True)
    assert features_exhibited >= 1
elif genre == "Animación":
    features = count(... tipo=="Largometraje" and exhibited==True)
    shorts = count(... tipo=="Cortometraje" and exhibited==True)
    assert features >= 1 or shorts >= 3
```

### 5.2 Director
```python
if genre in ["Ficción", "Documental"]:
    features = count(director.filmography where tipo=="Largometraje" and completed==True)
    shorts = count(... tipo in ["Cortometraje", "Obra audiovisual"] and completed==True)
    assert features >= 1 or shorts >= 2
elif genre == "Animación":
    features = count(... tipo=="Largometraje" and completed==True)
    shorts = count(... tipo in ["Cortometraje", "Obra audiovisual"] and completed==True)
    assert features >= 1 or shorts >= 1
```

### 5.3 Producer Must Be ERPI Partner
```python
assert producer.es_socio_erpi == True
```

---

## 6. ERPI ELIGIBILITY (BLOCKER)

```python
# Count authorized EFICINE projects that haven't been exhibited yet
unexhibited = count(erpi.prior_projects where authorized==True and exhibited==False)
assert unexhibited < 2  # If 2+ unexhibited → INELIGIBLE

# Max 3 submissions per period
assert submissions_this_period <= 3

# Max 3 total attempts for this specific project
assert project_attempts <= 3
```

---

## 7. PROHIBITED EFICINE EXPENDITURES (BLOCKER)

Scan the flujo de efectivo for any EFICINE-sourced funds allocated to prohibited categories:

```python
prohibited_categories = [
    "gastos_previos_al_estimulo",      # Expenses before receiving stimulus
    "distribucion_difusion_comercializacion",
    "elaboracion_carpeta",
    "completion_bond",
    "mark_up_servicios_produccion",
    "honorarios_erpi_persona_fisica",   # If ERPI is persona física, they can't pay themselves
    "activos_fijos",
    "gastos_admin_post_coprod_internacional_mayoritaria"  # Only if foreign coproducer is majority
]

for line_item in flujo_efectivo:
    if line_item.source == "EFICINE":
        assert line_item.category not in prohibited_categories
```

---

## 8. DOCUMENT COMPLETENESS (BLOCKER)

Every section (A through E) has documents marked as REQUIRED. If ANY is missing, the project is not sent to the evaluation council.

```python
required_a = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8a", "A8b", "A9a", "A9b", "A9d", "A10"]
required_b = ["B1_producer", "B1_director", "B2_all_ids", "B3_producer_contract", "B3_director_contract"]
required_c = ["C2a_indautor", "C2b_cesion", "C3a_buenas_practicas", "C3b_pics", "C4_ficha_tecnica"]
required_d = ["D1_seguro", "D1_contador"]
required_e = ["E1_esquema_financiero"]
# E2, E3, E4 conditionally required based on financial structure

for doc in all_required:
    assert doc.status == "completo"
```

---

## 9. FILE FORMAT COMPLIANCE (BLOCKER)

```python
for file in all_output_files:
    assert file.format == "PDF"
    assert file.size_mb <= 40
    assert len(file.name) <= 15
    assert re.match(r'^[A-Za-z0-9_]+\.pdf$', file.name)
    # No accents, ñ, commas, &, spaces, or other symbols
```

---

## 10. HYPERLINK ACCESSIBILITY (WARNING)

```python
for link in all_hyperlinks:
    # Director's prior work links (A4)
    # Material visual links (A5)
    # Postproduction first cut link (if applicable)
    assert link.is_publicly_accessible == True  # No password, no email required
    # For postproduction: watermark "EFICINE PRODUCCIÓN" must not exceed 1/4 of visible image
```

---

## 11. RUTA CRÍTICA ↔ FLUJO DE EFECTIVO SYNC (WARNING)

The months/stages in the ruta crítica should align with the spending timeline in the flujo de efectivo. If the ruta crítica says rodaje happens in Month 3, EFICINE production funds should flow in that period.

```python
for stage in ruta_critica:
    corresponding_flujo_months = flujo_efectivo.get_months(stage.etapa)
    assert stage.months overlap with corresponding_flujo_months
```

---

## 12. CO-PRODUCTION SPECIAL RULES (CONDITIONAL BLOCKER)

If `es_coproduccion_internacional == True`:

```python
# Must have IMCINE prior recognition
assert imcine_recognition_certificate == True

# Budget must split national vs. foreign spend
assert budget_has_territorial_split == True  # "Gasto en territorio nacional" vs "Gasto en el extranjero"

# Foreign currency must show MXN equivalent + exchange rate at registration date
for foreign_contribution in international_contributions:
    assert foreign_contribution.mxn_equivalent is not None
    assert foreign_contribution.exchange_rate is not None
    assert foreign_contribution.exchange_rate_date == registration_date

# Propuesta de producción must justify Mexican creative participation
# (distinguish co-production from mere production services)
assert propuesta_produccion.justificacion_coproduccion is not None
```

---

## 13. BONUS POINTS ELIGIBILITY (WARNING)

Non-cumulative — only ONE applies:

```python
if bonus_category == "a_directora_mujer":
    assert director.es_mujer == True
    assert director.es_codirector_con_hombre == False

elif bonus_category == "b_director_indigena_afromexicano":
    assert director.es_indigena_afromexicano == True
    assert director.es_codirector_con_no_miembro == False
    assert carta_autoadscripcion_uploaded == True

elif bonus_category == "c_descentralizacion_regional":
    assert director_or_producer.originario_fuera_zmcm == True
    assert porcentaje_rodaje_fuera_zmcm >= 75
    assert porcentaje_personal_creativo_local >= 50
    assert porcentaje_personal_tecnico_local >= 50
    assert erpi_domicilio_fiscal_fuera_zmcm == True

elif bonus_category == "d_equipo_creativo_completo":
    # Creative team = producer, screenwriter, DP, art director, editor
    # If not all 5 roles exist, post-production roles can substitute
    assert all_creative_team_are_women_or_indigenous == True
    assert no_co_direction_with_non_qualifying == True
```
