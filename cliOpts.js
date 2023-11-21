const { existsSync } = require('node:fs');
const kebabCase = require('./utils/kebabCase');
const merge = require('./utils/merge');

const updateQuestions = [{
  message: 'Update available. Update now?',
  type: 'list',
  name: 'update',
  default: 0,
  choices: [
    { name: 'Yes', value: 'now' },
    { name: 'Later', value: 'later' },
  ],
}];

const projectType = 'node';
const deployOpts = ({ addClient, forCLI }) => {
  return [
    { name: 'GitHub Page', value: { ghPage: true }, checked: false },
  ].filter(({ value: { ghPage } }) => {
    if (forCLI) return true;
    if (!addClient && ghPage) return false;
    return true;
  });
};
// NOTE: Whenever I'm checking if `answers` has the same property but `undefined`,
//       it's so stuff can be set via CLI flags.
const scaffoldQuestions = [
  // {
  //   message: 'Project Type',
  //   type: 'list',
  //   name: 'projectType',
  //   choices: [
  //     { name: 'Node.js', value: 'node' },
  //   ],
  // },
  {
    message: 'Remove previously scaffolded files?',
    type: 'confirm',
    name: 'removePreviousScaffold',
    when: ({ PATH__PROJECT_ROOT }) => {
      let previouslyScaffolded = false;
      
      if (projectType === 'node') previouslyScaffolded = existsSync(`${PATH__PROJECT_ROOT}/src`);
      
      return previouslyScaffolded;
    },
  },
  {
    message: 'Add Server',
    type: 'confirm',
    name: 'addServer',
  },
  {
    message: '  Server Framework',
    type: 'list',
    name: 'serverFramework',
    default: 0,
    when: ({ addServer, serverFramework }) => addServer && serverFramework === undefined,
    choices: [
      { name: 'Node', value: 'node' },
      { name: 'Express', value: 'express' },
      { name: 'Polka', value: 'polka' },
    ],
  },
  {
    message: '  Server Options',
    type: 'checkbox',
    name: 'serverOptions',
    when: ({ addServer, serverOptions }) => addServer && serverOptions === undefined,
    filter: answers => merge(answers),
    choices: [
      {
        name: 'Will have an API',
        short: 'API',
        value: { apiEnabled: true },
        checked: false,
      },
      {
        name: 'Will make external requests',
        short: 'External Requests',
        value: { externalRequests: true },
        checked: false,
      },
      {
        name: 'Will serve static assets',
        short: '[middleware] Static',
        value: { middleware: { staticFiles: true } },
        checked: false,
      },
      {
        name: 'Should support User accounts',
        short: 'Users',
        value: { multiUser: true },
        checked: false,
      },
      {
        name: 'Should support https',
        short: 'Secure',
        value: { secure: true },
        checked: false,
      },
      {
        name: 'Should support virtual hosts',
        short: 'VHosts',
        value: { vHost: true },
        checked: false,
      },
      {
        name: 'Should support Web Sockets',
        short: 'Web Socket',
        value: { webSocket: true },
        checked: false,
      },
      {
        name: 'Should gzip responses',
        short: '[middleware] GZip',
        value: { middleware: { compression: true } },
        checked: false,
      },
      {
        name: 'Should be able to read/write cookies',
        short: '[middleware] Cookies',
        value: { middleware: { cookies: true } },
        checked: false,
      },
    ],
  },
  {
    message: 'Add Client',
    type: 'confirm',
    name: 'addClient',
  },
  {
    message: '  Client Framework',
    type: 'list',
    name: 'clientFramework',
    when: ({ addClient, clientFramework }) => addClient && clientFramework === undefined,
    default: 1,
    choices: [
      { name: 'None', value: 'none' },
      { name: 'Svelte', value: 'svelte' },
    ],
  },
  {
    message: '  Bundler',
    type: 'list',
    name: 'bundler',
    when: ({ addClient, bundler }) => addClient && bundler === undefined,
    choices: ({ clientFramework }) => {
      return [
        { name: 'None', value: 'none' },
        { name: 'Webpack', value: 'webpack' },
        // { name: 'Rollup', value: 'rollup' },
      ].filter(q => {
        if (clientFramework !== 'svelte') return true;
        return clientFramework === 'svelte' && q.value !== 'none';
      });
    },
  },
  {
    message: 'Dev Options',
    type: 'checkbox',
    name: 'devOptions',
    when: ({ addClient, addServer, devOptions }) => (addClient || addServer) && devOptions === undefined,
    filter: answers => merge(answers),
    choices: [
      { name: 'Add .env file', value: { dotenv: true }, checked: false },
      { name: 'Add e2e tests', value: { e2eTests: true }, checked: false },
      { name: 'Add fancy logging util', value: { logger: 'ulog' }, checked: true },
      { name: 'ESLint', value: { eslint: true }, checked: true },
      { name: 'Watch for changes', value: { hasWatcher: true }, checked: true },
    ],
  },
  {
    message: 'App Title',
    type: 'input',
    name: 'appTitle',
    default: 'App',
  },
  {
    message: 'Logger Namespace',
    type: 'input',
    name: 'loggerNamespace',
    default: 'app',
  },
  {
    message: 'LocalStorage Namespace',
    type: 'input',
    name: 'storageNamespace',
    default: ({ loggerNamespace }) => loggerNamespace || 'app',
    when: ({ serverOptions }) => serverOptions && serverOptions.multiUser,
  },
  {
    message: 'Container Platform',
    type: 'list',
    name: 'containerPlatform',
    default: ({ devOptions, serverOptions }) => {
      if (devOptions?.e2eTests || serverOptions?.vHost) return 1;
      return 1; // keeping the above logic in case I change this later
    },
    when: ({ containerPlatform }) => containerPlatform === undefined,
    choices: [
      { name: 'None', value: 'none' },
      { name: 'Docker', value: 'docker' },
    ],
  },
  {
    message: '  Docker Username',
    type: 'input',
    name: 'docker.username',
    default: 'theonewhoknocks',
    when: ({ containerPlatform }) => containerPlatform === 'docker',
  },
  // {
  //   message: '  Docker Password',
  //   type: 'password',
  //   mask: '*',
  //   name: 'docker.password',
  //   when: ({ containerPlatform }) => containerPlatform === 'docker',
  // },
  {
    message: 'Deployment Options',
    type: 'checkbox',
    name: 'deploymentOptions',
    filter: answers => merge(answers),
    when: answers => !!deployOpts(answers).length && answers.deploymentOptions === undefined,
    choices: answers => deployOpts(answers),
  },
];

// generate CLI flags ==========================================================

const parseName = (str) => {
  // maintain dots in name
  return str.split('.').map((word) => {
    // separate camel-case to words
    const _str = word.split(/(?=[A-Z])/).join(' ');
    // convert to kebab-case
    return kebabCase(_str);
  }).join('.');
};
  
const cliOpts = scaffoldQuestions.reduce((obj, { choices, default: dflt, message, name, type }) => {
  const _name = parseName(name);
  let _choices = (typeof choices === 'function') ? choices({ forCLI: true }) : choices;
  
  obj[_name] = { description: message.trim() };
  
  switch (type) {
    case 'checkbox': {
      delete obj[_name];
      
      _choices.forEach(({ name: subDesc, value }) => {
        const [ subName ] = Object.keys(value);
        let _subName = `${_name}.${parseName(subName)}`;
        
        if (typeof value[subName] === 'object') {
          const [ subSubName ] = Object.keys(value[subName]);
          _subName = `${_subName}.${parseName(subSubName)}`;
        }
        
        obj[_subName] = {
          type: 'boolean',
          description: subDesc,
        };
      });
      
      break;
    }
    
    case 'confirm': {
      Object.assign(obj[_name], {
        type: 'boolean',
      });
      
      break;
    }
    
    case 'list': {
      _choices = _choices.map(({ value }) => value);
      
      Object.assign(obj[_name], {
        choices: _choices,
      });
      
      break;
    }
    
    case 'input': {
      Object.assign(obj[_name], {
        type: 'string',
        nargs: 1,
      });
      
      break;
    }
  }
  
  return obj;
}, {
  'skip-update-check': {
    type: 'boolean',
    default: false,
    description: "Don't check for updates to this repo.",
  },
});

// =============================================================================

module.exports = {
  cliOpts,
  projectType,
  scaffoldQuestions,
  updateQuestions,
};
