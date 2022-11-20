import { DEFAULT_FIELD_CONFIG } from './config'
import { getField, showField, hideField } from 'zeev-utils'

export function useField (config) {
  const params = {
    ...DEFAULT_FIELD_CONFIG,
    ...config
  }

  const state = {
    values: []
  }

  const instance = {
    field: [],
    triggers: [],
    effect,
    value
  }

  init()

  return instance

  /**
   * Configura a instância `useField`, registrando eventos
   * e verificando condições `when`
   */
  function init () {
    const taskAlias = document.querySelector('#inpDsFlowElementAlias')

    instance.field = getField(params.field, { returnArray: true })
    instance.triggers = params.triggers

    if (params.alias && taskAlias) {
      if (!params.alias.includes(taskAlias.value)) return
    }

    addTriggers(instance.field)

    if (params.runOnload) {
      handleEffect()
    }
  }

  /**
   * @private
   * Adiciona os eventos ao campo de formulário
   * @param {HTMLElement[]} field - campo de formulário
   */
  function addTriggers (field) {
    instance.triggers
      .forEach(trigger =>
        field.forEach(input => input.addEventListener(trigger, handleEffect))
      )
  }

  /**
   * @private
   * Retorna os valores de um campo de formulário,
   * sendo checkboxes e radio somente com valores checked
   * @return {string|string[]} - valores do campo de formulário
   */
  function getFieldValue () {
    const type = instance.field[0].type

    if (type === 'checkbox') {
      return instance.field
        .filter(field => field.checked)
        .map(field => field.value)
    }

    if (type === 'radio') {
      return [
        instance.field
          .find(field => field.checked)?.value
      ]
    }

    return [instance.field[0].value]
  }

  /**
   * @private
   * @param {object} event - HTML input event - document#event
   */
  function handleEffect (event) {
    const values = getFieldValue(instance.field)

    state.values = values

    if (params.callback) params.callback(values, event)
    if (!params.when) return

    const { match, notMatch } = Object.entries(params.when)
      .reduce((fields, [condition, options]) => {
        values.includes(condition)
          ? fields.match.push(params.when[condition])
          : fields.notMatch.push(params.when[condition])

        return fields
      }, { match: [], notMatch: [] })

    match.forEach(options => handleMatchCondition(options, values, event))
    notMatch.forEach(options => handleNotMatchCondition(options))
  }

  /**
   * @private
   * Trata o resultado de condições falsas da propriedade `when`
   * @param {object} options - configuração `when`
   */
  function handleNotMatchCondition (options) {
    const utilsConfig = { container: options.container || params.container }

    if (options.show) {
      options.show.forEach(fieldId => hideField(fieldId, utilsConfig))
    }

    if (options.showGroup) {
      hideGroupField(options.showGroup, utilsConfig)
    }
  }

  /**
   * @private
   * Trata o resultado de condições verdadeiras da propriedade `when`
   * @param {object} options - configuração `when`
   * @param {string[]} values - valores do campo de formulário
   * @param {object} event - HTML input event - document#event
   */
  function handleMatchCondition (options, values, event) {
    const utilsConfig = { container: options.container || params.container }

    if (options.callback) options.callback(values, event)

    if (options.show) {
      options.show.forEach(fieldId => showField(fieldId, utilsConfig))
    }

    if (options.showGroup) {
      showGroupField(options.showGroup, utilsConfig)
    }
  }

  /**
   * @private
   * Exibe todos os campos do Orquestra encontrados
   * nos containers
   * @param {string[]} selectors - query selectors dos containers
   * @param {object} config - configuração da função `showField`
   */
  function showGroupField (selectors, config) {
    selectors.forEach(selector => {
      const container = document.querySelector(selector)

      if (!container) return

      container.classList.remove(params.hiddenClass)

      container.querySelectorAll('[xname]')
        .forEach(field => showField(field, config))
    })
  }

  /**
   * @private
   * Oculta todos os campos do Orquestra encontrados
   * nos containers
   * @param {string[]} selectors - query selectors dos containers
   * @param {object} config - configuração da função `hideField`
   */
  function hideGroupField (selectors, config) {
    selectors.forEach(selector => {
      const container = document.querySelector(selector)

      if (!container) return

      container.classList.add(params.hiddenClass)

      container.querySelectorAll('[xname]')
        .forEach(field => hideField(field, config))
    })
  }

  /**
   * @public
   * Dispara manualmente a verificação das condições  `when`
   */
  function effect () {
    handleEffect()
  }

  /**
   * @public
   * @return {string[]} valores atuais do campo de formulário
   */
  function value () {
    return state.values
  }
}

export const useFields = fieldsConfig =>
  fieldsConfig.forEach(useField)
