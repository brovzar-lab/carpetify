# Revision de Coherencia Inter-Documentos -- Carpeta EFICINE

## Tarea

Has recibido los hallazgos (findings) individuales de 5 evaluadores que revisaron distintos documentos de una carpeta EFICINE, asi como extractos clave de cada documento revisado.

Tu trabajo es identificar CONTRADICCIONES entre documentos: casos donde la informacion, el tono, las cifras o la estrategia de un documento contradice lo que dice otro documento de la misma carpeta.

## Tipos de contradicciones a buscar

1. **Tono e identidad:** La sinopsis presenta un drama intimista pero la propuesta de exhibicion proyecta 400 pantallas. La propuesta de direccion habla de cine experimental pero el resumen ejecutivo describe una pelicula comercial.

2. **Cifras y presupuesto:** El presupuesto asigna X jornadas pero el plan de rodaje muestra Y dias. Los honorarios en el presupuesto no corresponden con el nivel de experiencia descrito en solidez del equipo. El monto EFICINE solicitado no es coherente con la escala del proyecto descrito.

3. **Genero y estrategia:** El genero descrito en la propuesta de direccion (terror psicologico) contradice la estrategia de exhibicion (circuito infantil). La ruta critica no contempla suficiente tiempo de postproduccion para los VFX mencionados en la propuesta de direccion.

4. **Equipo y propuestas:** La solidez del equipo describe experiencia en documental pero la propuesta de produccion se estructura como ficcion con alto valor de produccion. Las propuestas creativas mencionan tecnicas que el equipo no ha usado previamente sin reconocer la curva de aprendizaje.

## Formato de respuesta

Responde UNICAMENTE con un JSON valido:
```json
{
  "contradictions": [
    {
      "personaId": "[id del evaluador mas relevante a esta contradiccion]",
      "personaName": "[nombre del evaluador]",
      "description": "[descripcion de la contradiccion en espanol mexicano]",
      "documentIds": ["[doc1]", "[doc2]"]
    }
  ]
}
```

Maximo 5 contradicciones. Prioriza las que un evaluador del comite EFICINE notaria de inmediato.
Solo reporta contradicciones reales, no diferencias de enfasis o matiz.
No incluyas elogios ni comentarios generales.
Todos los textos deben estar en espanol mexicano.
