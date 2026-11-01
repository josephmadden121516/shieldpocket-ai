import { useState, type FormEvent } from 'react'
import { AskSophiaFollowUp } from './AskSophiaFollowUp'
import { requestInsuranceReadiness } from '../lib/securityAdvisors'
import './CyberInsuranceReadiness.css'

const MAX_NOTES_LENGTH = 2000
const MAX_INDUSTRY_LENGTH = 120

interface CyberInsuranceReadinessProps {
  language: 'en' | 'es'
}

interface ControlOption {
  id: string
  labelEn: string
  labelEs: string
}

const CONTROL_OPTIONS: ControlOption[] = [
  {
    id: 'mfa',
    labelEn: 'Multifactor authentication on email and remote access',
    labelEs: 'Autenticación multifactor en correo y acceso remoto',
  },
  {
    id: 'backups',
    labelEn: 'Backups kept offline or immutable, restore tested',
    labelEs: 'Respaldos aislados o inmutables, restauración probada',
  },
  {
    id: 'incident-plan',
    labelEn: 'Written incident response plan with contacts',
    labelEs: 'Plan de respuesta a incidentes escrito, con contactos',
  },
  {
    id: 'patching',
    labelEn: 'Security patches applied at least monthly',
    labelEs: 'Parches de seguridad aplicados al menos cada mes',
  },
  {
    id: 'training',
    labelEn: 'Security awareness training in the last year',
    labelEs: 'Capacitación en seguridad en el último año',
  },
  {
    id: 'endpoint',
    labelEn: 'Endpoint protection (EDR/antivirus) on work devices',
    labelEs: 'Protección en dispositivos de trabajo (EDR/antivirus)',
  },
  {
    id: 'email',
    labelEn: 'Email filtering with SPF/DKIM/DMARC configured',
    labelEs: 'Filtrado de correo con SPF/DKIM/DMARC configurado',
  },
]

const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '200+'] as const

export function CyberInsuranceReadiness({
  language,
}: CyberInsuranceReadinessProps) {
  const isEs = language === 'es'
  const [size, setSize] = useState<(typeof SIZE_OPTIONS)[number]>('1-10')
  const [industry, setIndustry] = useState('')
  const [sensitiveData, setSensitiveData] = useState(false)
  const [controls, setControls] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [report, setReport] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleControl(id: string) {
    setControls((current) => ({ ...current, [id]: !current[id] }))
    setReport('')
    setErrorMessage('')
  }

  function buildProfile(): string {
    const lines = [
      isEs ? `Tamaño: ${size} empleados.` : `Size: ${size} employees.`,
    ]
    const trimmedIndustry = industry.trim()
    if (trimmedIndustry) {
      lines.push(
        isEs ? `Sector: ${trimmedIndustry}.` : `Industry: ${trimmedIndustry}.`
      )
    }
    lines.push(
      sensitiveData
        ? isEs
          ? 'Maneja datos sensibles de clientes (pagos, salud o identidad).'
          : 'Handles sensitive customer data (payments, health, or identity).'
        : isEs
          ? 'No maneja datos sensibles de clientes.'
          : 'Does not handle sensitive customer data.'
    )
    for (const option of CONTROL_OPTIONS) {
      const inPlace = controls[option.id] === true
      lines.push(
        `- [${inPlace ? 'x' : ' '}] ${isEs ? option.labelEs : option.labelEn}`
      )
    }
    const trimmedNotes = notes.trim()
    if (trimmedNotes) {
      lines.push(
        isEs
          ? `Notas adicionales: ${trimmedNotes}`
          : `Additional notes: ${trimmedNotes}`
      )
    }
    return lines.join('\n')
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setReport('')
    setErrorMessage('')
    try {
      const result = await requestInsuranceReadiness(buildProfile(), language)
      setReport(result)
    } catch (error) {
      console.error('Could not generate the readiness report.', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isEs
            ? 'No se pudo generar el informe de preparación.'
            : 'Could not generate the readiness report.'
      )
    } finally {
      setLoading(false)
    }
  }

  function downloadReport() {
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'shieldpocket-insurance-readiness.md'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section
      id="insurance-readiness"
      className="content-card insurance-readiness"
      aria-labelledby="insurance-readiness-title"
    >
      <div className="card-heading">
        <div>
          <h2 id="insurance-readiness-title">
            {isEs
              ? 'Preparación para ciberseguro'
              : 'Cyber-insurance readiness'}
          </h2>
          <p>
            {isEs
              ? 'Describe tus controles y recibe un informe de preparación de una página: estado, respuestas probables, brechas y evidencia a reunir.'
              : 'Describe your controls and get a one-page readiness report: status, likely answers, gaps, and evidence to gather.'}
          </p>
        </div>
        <span className="demo-tag">{isEs ? 'ORIENTACIÓN CON IA' : 'AI GUIDANCE'}</span>
      </div>

      <form onSubmit={(event) => void submitProfile(event)}>
        <div className="insurance-readiness-grid">
          <div>
            <label htmlFor="insurance-readiness-size">
              {isEs ? 'Tamaño del negocio' : 'Business size'}
            </label>
            <select
              id="insurance-readiness-size"
              value={size}
              disabled={loading}
              onChange={(event) => {
                setSize(event.target.value as (typeof SIZE_OPTIONS)[number])
                setReport('')
                setErrorMessage('')
              }}
            >
              {SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} {isEs ? 'empleados' : 'employees'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="insurance-readiness-industry">
              {isEs ? 'Sector (opcional)' : 'Industry (optional)'}
            </label>
            <input
              id="insurance-readiness-industry"
              type="text"
              value={industry}
              maxLength={MAX_INDUSTRY_LENGTH}
              disabled={loading}
              autoComplete="off"
              onChange={(event) => {
                setIndustry(event.target.value)
                setReport('')
                setErrorMessage('')
              }}
              placeholder={isEs ? 'Ej.: clínica dental' : 'E.g. dental clinic'}
            />
          </div>
        </div>

        <fieldset className="insurance-readiness-controls">
          <legend>
            {isEs
              ? 'Marca los controles que ya tienes en marcha'
              : 'Check the controls you already have in place'}
          </legend>
          {CONTROL_OPTIONS.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                checked={controls[option.id] === true}
                disabled={loading}
                onChange={() => toggleControl(option.id)}
              />
              <span>{isEs ? option.labelEs : option.labelEn}</span>
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={sensitiveData}
              disabled={loading}
              onChange={(event) => {
                setSensitiveData(event.target.checked)
                setReport('')
                setErrorMessage('')
              }}
            />
            <span>
              {isEs
                ? 'Manejamos datos sensibles de clientes'
                : 'We handle sensitive customer data'}
            </span>
          </label>
        </fieldset>

        <label htmlFor="insurance-readiness-notes">
          {isEs ? 'Notas adicionales (opcional)' : 'Additional notes (optional)'}
        </label>
        <textarea
          id="insurance-readiness-notes"
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
          rows={3}
          onChange={(event) => {
            setNotes(event.target.value)
            setReport('')
            setErrorMessage('')
          }}
          placeholder={
            isEs
              ? 'Contexto útil: renovaciones, incidentes pasados, herramientas. No incluyas secretos ni datos personales.'
              : 'Useful context: renewals, past incidents, tooling. Do not include secrets or personal data.'
          }
        />
        <div className="insurance-readiness-input-meta">
          <span>
            {notes.length} / {MAX_NOTES_LENGTH}
          </span>
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? isEs
                ? 'Generando...'
                : 'Generating...'
              : isEs
                ? 'Generar informe de preparación'
                : 'Generate readiness report'}
          </button>
        </div>
      </form>

      <p className="insurance-readiness-disclaimer">
        {isEs
          ? 'Al generar, este perfil se envía a Supabase y Meta y usa créditos de API. El informe es preparación preliminar, no asesoría de seguros ni legal, ni una decisión de suscripción. Revísalo con tu aseguradora o corredor antes de responder una solicitud real.'
          : 'When you generate, this profile is sent to Supabase and Meta and uses API credits. The report is preliminary preparation only, not insurance or legal advice or an underwriting decision. Review it with your insurer or broker before answering a real application.'}
      </p>

      {errorMessage && (
        <p className="insurance-readiness-error" role="alert">
          {errorMessage}
        </p>
      )}

      {report && (
        <div className="insurance-readiness-result" role="status" aria-live="polite">
          <h3>
            {isEs ? 'Informe de preparación' : 'Readiness report'}
          </h3>
          <pre>{report}</pre>
          <button
            type="button"
            className="secondary-button"
            onClick={downloadReport}
          >
            {isEs ? 'Descargar Markdown' : 'Download Markdown'}
          </button>
          <AskSophiaFollowUp
            language={language}
            context={report}
            contextKey={report}
          />
        </div>
      )}
    </section>
  )
}
