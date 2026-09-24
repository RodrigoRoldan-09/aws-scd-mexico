"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Snippets reales de AWS: se elige uno al azar en cada carga, así el fondo
// nunca se ve idéntico dos veces.
const SNIPPETS = [
  `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });
export const handler = async (event) => {
  const key = \`uploads/\${event.requestContext.requestId}.json\`;
  await s3.send(new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, Body: JSON.stringify(event.body) }));
  return { statusCode: 200, body: JSON.stringify({ ok: true, key }) };
};`,
  `resource "aws_lambda_function" "scd" {
  function_name = "scd-mexico-registro"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  environment { variables = { TABLE = aws_dynamodb_table.registros.name } }
}
resource "aws_dynamodb_table" "registros" {
  name         = "scd-mexico-registros"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"
  attribute { name = "email" type = "S" }
}`,
  `import boto3, json
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
def ask(prompt: str) -> str:
    body = {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}]}
    res = bedrock.invoke_model(modelId="anthropic.claude-sonnet-4-5", body=json.dumps(body))
    return json.loads(res["body"].read())["content"][0]["text"]
print(ask("como despliego una app en AWS?"))`,
  `AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31
Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs22.x
      Handler: app.handler
      MemorySize: 512
      Policies: [ AWSLambdaBasicExecutionRole, DynamoDBCrudPolicy ]
      Events:
        Api: { Type: HttpApi, Properties: { Path: /registro, Method: post } }`,
];

/**
 * Fondo del hero: un snippet que se teclea línea a línea, muy tenue, detrás
 * del contenido. El ancho de línea se calcula con el ancho real del carácter
 * de la fuente monoespaciada, así el wrap no descuadra en ningún viewport.
 */
export function CodeTyper() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [charsPerLine, setCharsPerLine] = useState(0);
  const [visible, setVisible] = useState(0);

  // Sorteo perezoso: sólo se evalúa en el primer render de cada instancia.
  // No hay riesgo de hydration mismatch porque el servidor no pinta ninguna
  // línea (`charsPerLine` arranca en 0 y sólo se mide ya en el navegador).
  const [snippet] = useState(
    () => SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)],
  );

  // Mide cuántos caracteres caben por línea y re-mide al redimensionar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const probe = document.createElement("span");
      // Se copian las propiedades una a una: el shorthand `font` puede venir
      // vacío y entonces la medida sale mal y no se pinta ninguna línea.
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontSize = cs.fontSize;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "pre";
      probe.textContent = "0".repeat(100);
      document.body.appendChild(probe);
      const charWidth = probe.offsetWidth / 100;
      document.body.removeChild(probe);
      if (charWidth > 0) {
        setCharsPerLine(Math.max(20, Math.floor(el.offsetWidth / charWidth) - 2));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Envuelve el snippet a `charsPerLine`, respetando los saltos propios del código.
  const lines = useMemo(() => {
    if (!charsPerLine) return [];
    const out: string[] = [];
    for (const raw of snippet.split("\n")) {
      if (raw.length <= charsPerLine) {
        out.push(raw);
        continue;
      }
      const indent = raw.match(/^\s*/)?.[0] ?? "";
      let current = "";
      for (const word of raw.trim().split(/\s+/)) {
        const next = current ? `${current} ${word}` : `${indent}${word}`;
        if (next.length > charsPerLine) {
          out.push(current);
          current = `${indent}  ${word}`;
        } else {
          current = next;
        }
      }
      if (current) out.push(current);
    }
    // Se repite hasta llenar la pantalla: el hero es alto y no queremos huecos.
    const filled = [...out];
    while (filled.length < 90) filled.push(...out);
    return filled;
  }, [snippet, charsPerLine]);

  // Revela una línea a la vez, a un ritmo proporcional a su largo.
  useEffect(() => {
    if (reduced || !lines.length || visible >= lines.length) return;
    const delay = Math.max(90, lines[visible].length * 7);
    const id = setTimeout(() => setVisible((v) => v + 1), delay);
    return () => clearTimeout(id);
  }, [visible, lines, reduced]);

  const shown = reduced ? lines : lines.slice(0, visible);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        ref={ref}
        className="h-full w-full whitespace-pre px-4 pt-20 font-mono text-[11px] leading-[1.45] text-surface-600 mix-blend-plus-lighter sm:text-xs"
      >
        {shown.map((line, i) => (
          <div
            key={i}
            className="overflow-hidden"
            style={
              reduced
                ? undefined
                : {
                    // El ancho crece con steps() → efecto de tecleo real por línea.
                    animation: `type-line ${Math.max(120, line.length * 7)}ms steps(${Math.max(line.length, 1)}, end) both`,
                  }
            }
          >
            {line || "\u00A0"}
          </div>
        ))}
      </div>
      {/* Viñeta suave detrás del texto del hero: da contraste sin tapar el código */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(10,10,15,0.75),transparent_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-900 to-transparent" />
    </div>
  );
}
