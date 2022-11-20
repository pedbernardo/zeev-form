(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ZeevForm = {}));
})(this, (function (exports) { 'use strict';

  const DEFAULT_FIELD_CONFIG = {
    triggers: ['change'],
    runOnload: true,
    container: 'tr',
    hiddenClass: 'hidden'
  };

  const config = {
    container: 'tr',
    hideClass: 'hidden',
    toggleRequiredClass: false,
    requiredClass: 'execute-required',
    requiredAttr: 'data-was-required'
  };

  /* istanbul ignore file */
  function log (message, level = 'warn') {
    const logger = logLevels[level] || console.log;

    logger(`[zeev-utils] ${message}`);
  }

  const logLevels = {
    warn: console.warn,
    error: console.error,
    log: console.log
  };

  const FIELD_TYPES_VALUE_BASED = [
    'text',
    'textarea',
    'select-one',
    'hidden'
  ];

  // ------------------------------------------------------------------------------------
  // 🔑 Funções Públicas
  // ------------------------------------------------------------------------------------

  /**
   * @public
   * Busca campos de formulário do Zeev
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @param {Object=} options - configurações
   * @param {Boolean=} options.returnArray - força que o retorno seja um array mesmo quando houver somente 1 campo
   * @returns {HTMLElement|HTMLElement[]} - campo ou array com os campos encontrados
   */
  function getField (field, { returnArray } = {}) {
    returnArray = returnArray || false;

    if (field.jquery) {
      return returnArray || field.length > 0
        ? [...field]
        : field[0]
    }

    if (field instanceof HTMLElement) {
      return returnArray
        ? [field]
        : field
    }

    if (
      field instanceof HTMLCollection ||
      field instanceof NodeList ||
      Array.isArray(field)
    ) {
      return [...field]
    }

    if (typeof field === 'string') {
      return getFieldById(field, { returnArray })
    }
  }

  /**
   * @public
   * Busca o container de um campo de formulário do Zeev
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @param {String} containerSelector - seletor do elemento que contém o campo de formulário
   * @returns {HTMLElement} container do campo de formulário
   */
  function getFieldContainer (field, containerSelector) {
    field = getField(field, { returnArray: true });

    if (!field || !containerSelector) {
      log('Os parâmetros field e containerSelector devem ser informados');
      return null
    }

    const [fieldElement] = field;
    const container = fieldElement.closest(containerSelector);
    const fieldId = fieldElement.getAttribute('xname').substring(3);

    if (!container) {
      log(`Não foi encontrado nenhum elemento para referência ${containerSelector} a partir do campo ${fieldId}`);
      return null
    }

    return container
  }

  /**
   * @public
   * Limpa o valor de um campo de formulário do Zeev
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @returns {HTMLElement[]} - campos encontrados
   */
  function clearField (field) {
    field = getField(field, { returnArray: true });

    if (!field) return

    field.forEach(fieldElement => {
      const fieldType = fieldElement.type;
      const xType = fieldElement.getAttribute('xtype');

      if (FIELD_TYPES_VALUE_BASED.includes(fieldType)) {
        if (xType === 'FILE') {
          clearFileField(fieldElement);
        } else {
          fieldElement.value = '';
        }
      } else {
        fieldElement.checked = false;
      }

      fieldElement.dispatchEvent(new Event('change'));
    });

    return field
  }

  // ------------------------------------------------------------------------------------
  // 🔒 Funções Privadas
  // ------------------------------------------------------------------------------------

  /**
   * @private
   * Encontra um campo de formulário a partir do seu identificador
   * @param {String} fieldId - identificador do campo no Zeev
   * @param {Object=} options - configurações
   * @param {Boolean=} options.returnArray - força que o retorno seja um array mesmo quando houver somente 1 campo
   * @returns {HTMLElement|HTMLElement[]} - campo ou array com os campos encontrados
   */
  function getFieldById (fieldId, { returnArray } = {}) {
    returnArray = returnArray || false;

    if (!fieldId) {
      log('O parâmetro fieldId deve ser informado');
      return null
    }

    const xname = fieldId.substring(0, 3) === 'inp'
      ? fieldId
      : `inp${fieldId}`;

    const fields = document.querySelectorAll(`[xname="${xname}"]`);

    if (!fields.length) {
      log(`Nehum campo de formulário encontrado para o identificador ${fieldId}`);
      return null
    }

    if (returnArray || fields.length > 1) {
      return [...fields]
    }

    return fields[0]
  }

  /**
   * @private
   * Limpa o valor de um campo de formulário do tipo `Arquivo`
   * @param {HTMLElement} field - campo de formulário Zeev
   */
  function clearFileField (field) {
    const fieldId = field.getAttribute('xname').substring(3);
    const deleteBtn = field.parentElement
      .querySelector(`[xid=div${fieldId}] > a:last-of-type`);

    if (deleteBtn) {
      deleteBtn.click();
    }
  }

  // ------------------------------------------------------------------------------------
  // 🔑 Funções Públicas
  // ------------------------------------------------------------------------------------

  /**
   * @public
   * Verifica se o campo de formulário é obrigatório a partir da propriedade
   * `required="S"` utilizada pelo Zeev, ou então pelo atributo temporário
   * `data-was-required` adicionado pela função `hideField` do Zeev-Utils
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @returns {Boolean} se o campo é obrigatório
   */
  function isRequired (field) {
    field = getField(field, { returnArray: true });

    if (!field) return

    return field.some(
      field =>
        field.hasAttribute(config.requiredAttr) ||
        field.getAttribute('required') === 'S'
    )
  }

  /**
   * @public
   * Adiciona obrigatoriedade a um campo de forumário Zeev
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @param {Object=} options - configurações
   * @param {Boolean=} options.toggleRequiredClass - habilita a adição de classe auxiliar ao container do campo
   * @param {String=} options.requiredClass - classe auxiliar quando obrigatório
   * @param {String=} options.requiredAttr - atributo auxiliar quando obrigatório
   * @param {String=} options.container - seletor do elemento que contém o campo de formulário
   * @returns {HTMLElement[]} - campos encontrados
   */
  function addRequired (field, options) {
    options = {
      ...config,
      ...options
    };

    field = getField(field, { returnArray: true });

    if (!field) return

    const container = getFieldContainer(field, options.container);

    field.forEach(fieldElement => {
      fieldElement.setAttribute('required', 'S');
      fieldElement.removeAttribute(options.requiredAttr);
    });

    if (options.toggleRequiredClass && container) {
      container.classList.add(options.requiredClass);
    }

    return field
  }

  /**
   * @public
   * Remove obrigatoriedade a um campo de forumário Orquestra
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @param {Object=} options - configurações
   * @param {Boolean=} options.toggleRequiredClass - habilita a adição de classe auxiliar ao container do campo
   * @param {String=} options.requiredClass - classe auxiliar quando obrigatório
   * @param {String=} options.requiredAttr - atributo auxiliar quando obrigatório
   * @param {String=} options.container - seletor do elemento que contém o campo de formulário
   * @returns {HTMLElement[]} - campos encontrados
   */
  function removeRequired (field, options) {
    options = {
      ...config,
      ...options
    };

    field = getField(field, { returnArray: true });

    if (!field) return

    const container = getFieldContainer(field, options.container);

    field.forEach(fieldElement => {
      fieldElement.setAttribute('required', 'N');
      fieldElement.setAttribute(options.requiredAttr, true);
    });

    if (options.toggleRequiredClass && container) {
      container.classList.remove(options.requiredClass);
    }

    return field
  }

  // ------------------------------------------------------------------------------------
  // 🔑 Funções Públicas
  // ------------------------------------------------------------------------------------

  /**
   * @public
   * Exibe um campo de formulário Zeev removendo a classe auxiliar indicada
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @param {Object=} options - configurações
   * @param {String=} options.container - seletor do elemento que contém o campo de formulário
   * @param {String=} options.hideClass - classe auxiliar utilizada pra ocultar o campo
   * @returns {HTMLElement[]} - campos encontrados
   */
  function showField (field, options) {
    options = {
      ...config,
      ...options
    };

    if (!field) return

    const {
      elements,
      container,
      required
    } = handleField(field, options.container);

    if (!elements || !container) return

    if (required) addRequired(elements, options);

    container.classList.remove(options.hideClass);

    return elements
  }

  /**
   * @public
   * Oculta um campo de formulário Zeev adicionando a classe auxiliar indicada e limpando seu valor
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Zeev
   * @param {Object=} options - configurações
   * @param {String=} options.container - seletor do elemento que contém o campo de formulário
   * @param {String=} options.hideClass - classe auxiliar utilizada pra ocultar o campo
   * @returns {HTMLElement[]} - campos encontrados
   */
  function hideField (field, options) {
    options = {
      ...config,
      ...options
    };

    if (!field) return

    const {
      elements,
      container,
      required
    } = handleField(field, options.container);

    if (!elements || !container) return

    if (required) removeRequired(elements, options);

    container.classList.add(options.hideClass);
    clearField(elements);

    return elements
  }

  // ------------------------------------------------------------------------------------
  // 🔒 Funções Privadas
  // ------------------------------------------------------------------------------------

  /**
   * @private
   * @param {String|HTMLElement|HTMLCollection|jQuery} field - campo de formulário Orquestra
   * @param {String} containerSelector - seletor do elemento que contém o campo de formulário
   * @returns {Object} campo de formulário e informações auxiliares utilizadas internamente
   */
  function handleField (field, containerSelector) {
    field = getField(field, { returnArray: true });

    if (!field) return {}

    const container = getFieldContainer(field, containerSelector);

    if (!container) return {}

    return {
      container,
      elements: field,
      required: isRequired(field)
    }
  }

  function useField (config) {
    const params = {
      ...DEFAULT_FIELD_CONFIG,
      ...config
    };

    const state = {
      values: []
    };

    const instance = {
      field: [],
      triggers: [],
      effect,
      value
    };

    init();

    return instance

    /**
     * Configura a instância `useField`, registrando eventos
     * e verificando condições `when`
     */
    function init () {
      const taskAlias = document.querySelector('#inpDsFlowElementAlias');

      instance.field = getField(params.field, { returnArray: true });
      instance.triggers = params.triggers;

      if (params.alias && taskAlias) {
        if (!params.alias.includes(taskAlias.value)) return
      }

      addTriggers(instance.field);

      if (params.runOnload) {
        handleEffect();
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
        );
    }

    /**
     * @private
     * Retorna os valores de um campo de formulário,
     * sendo checkboxes e radio somente com valores checked
     * @return {string|string[]} - valores do campo de formulário
     */
    function getFieldValue () {
      const type = instance.field[0].type;

      if (type === 'checkbox') {
        return instance.field
          .filter(field => field.checked)
          .map(field => field.value)
      }

      if (type === 'radio') {
        return instance.field
          .find(field => field.checked)?.value
      }

      return instance.field[0].value
    }

    /**
     * @private
     * @param {object} event - HTML input event - document#event
     */
    function handleEffect (event) {
      const values = getFieldValue(instance.field);
      const valuesInArray = Array.isArray(values)
        ? values
        : [values];

      state.values = values;

      if (params.callback) params.callback(values, event);
      if (!params.when) return

      const { match, notMatch } = Object.entries(params.when)
        .reduce((fields, [condition, options]) => {
          valuesInArray.includes(condition)
            ? fields.match.push(params.when[condition])
            : fields.notMatch.push(params.when[condition]);

          return fields
        }, { match: [], notMatch: [] });

      match.forEach(options => handleMatchCondition(options, values, event));
      notMatch.forEach(options => handleNotMatchCondition(options));
    }

    /**
     * @private
     * Trata o resultado de condições falsas da propriedade `when`
     * @param {object} options - configuração `when`
     */
    function handleNotMatchCondition (options) {
      const utilsConfig = { container: options.container || params.container };

      if (options.show) {
        options.show.forEach(fieldId => hideField(fieldId, utilsConfig));
      }

      if (options.showGroup) {
        hideGroupField(options.showGroup, utilsConfig);
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
      const utilsConfig = { container: options.container || params.container };

      if (options.callback) options.callback(values, event);

      if (options.show) {
        options.show.forEach(fieldId => showField(fieldId, utilsConfig));
      }

      if (options.showGroup) {
        showGroupField(options.showGroup, utilsConfig);
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
        const container = document.querySelector(selector);

        if (!container) return

        container.classList.remove(params.hiddenClass);

        container.querySelectorAll('[xname]')
          .forEach(field => showField(field, config));
      });
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
        const container = document.querySelector(selector);

        if (!container) return

        container.classList.add(params.hiddenClass);

        container.querySelectorAll('[xname]')
          .forEach(field => hideField(field, config));
      });
    }

    /**
     * @public
     * Dispara manualmente a verificação das condições  `when`
     */
    function effect () {
      handleEffect();
    }

    /**
     * @public
     * @return {string[]} valores atuais do campo de formulário
     */
    function value () {
      return state.values
    }
  }

  const useFields = fieldsConfig =>
    fieldsConfig.forEach(useField);

  exports.useField = useField;
  exports.useFields = useFields;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
