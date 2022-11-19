/*
   Copyright 2022 Nikita Petko <petko@vmminfra.net>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/*
    File Name: index.ts
    Description: A class for loading environment variables from .env files programmatically.
    Written by: Nikita Petko
*/

import typeConverters from './type_converters';

import * as fs from 'fs';

/**
 * A method for getting the default environment variable if it is not set.
 */
export type DefaultValueGetter<T> = T | (() => T);

/**
 * A type that represents all the possible types of environment variables. Use this if you want your environment variable to be of a specific type or if you want the default to 
 * be null or undefined.
 */
export type EnvironmentVariableType = 'boolean' | 'number' | 'bigint' | 'array' | 'object' | 'regexp' | 'string';

/**
 * A class for loading environment variables from .env files programmatically.
 * 
 * Also provides methods for checking if the current environment is inside of a docker container.
 */
export default class Environment {
  /**
   * @internal This is a private member.
   */
  private static _isDocker?: boolean = undefined;

  /**
   * Tries to get then deserialize the value of the environment variable..
   *
   * @param {string} key The key of the environment variable.
   * @param {DefaultValueGetter<T>} [defaultValue] The default value of the environment variable.
   * @param {EnvironmentVariableType} [optionalType] The type of the environment variable.
   * @returns {T} The value of the environment variable.
   * @template T The type of the environment variable.
   * @protected This method is a protected method of the Environment class.
   * @memberof Environment
   */
  protected getOrDefault<T>(key: string, defaultValue?: DefaultValueGetter<T>, optionalType?: EnvironmentVariableType): T {
    let type = typeof defaultValue as string;

    // If default value is null, undefined or any type that cannot be inferred then throw
    if (defaultValue === null || defaultValue === undefined) {
      type = optionalType;
    }

    const value = process.env[key];

    switch (type) {
      case 'boolean':
        return typeConverters.toBoolean(value, defaultValue as boolean) as unknown as T;
      case 'number':
        return parseFloat(value ?? defaultValue?.toString()) as unknown as T;
      case 'bigint':
        return BigInt(value ?? defaultValue?.toString()) as unknown as T;
      case 'function':
        return (value as unknown as T) || (defaultValue as (() => T))?.call(null);
      case 'array':
        return (value?.split(',') as unknown as T) ?? defaultValue as T;
      case 'object':
        return JSON.parse(value ?? defaultValue?.toString()) as unknown as T;
      case 'regexp':
        return new RegExp(value ?? (defaultValue as RegExp).source, (defaultValue as RegExp).flags) as unknown as T;
      default:
        if (Array.isArray(defaultValue)) {
          return (value?.split(',') as unknown as T) ?? defaultValue;
        }
        if (defaultValue instanceof RegExp) {
          return new RegExp(value ?? defaultValue.source, defaultValue.flags) as unknown as T;
        }
        if (typeof defaultValue === 'object') {
          return JSON.parse(value ?? JSON.stringify(defaultValue)) as unknown as T;
        }

        return (value as unknown as T) || defaultValue as unknown as T;
    }
  }

  /**
   * Determines if the current context has the .dockerenv file.
   * @returns {boolean} True if the current context has the .dockerenv file.
   */
  public static hasDockerEnv(): boolean {
    if (process.platform !== 'linux') return false;

    return fs.existsSync('/.dockerenv');
  }

  /**
   * Determines if the current context has `docker` within it's CGroup.
   * @returns {boolean} True if the current context has `docker` within it's CGroup.
   */
  public static hasDockerCGroup(): boolean {
    if (process.platform !== 'linux') return false;

    try {
      return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
    } catch {
      return false;
    }
  }

  /**
   * Determines if the current context is running under a docker container.
   * @returns {boolean} True if the current context is running under a docker container.
   */
  public static isDocker(): boolean {
    if (process.platform !== 'linux') return false;

    if (this._isDocker === undefined) {
      this._isDocker = this.hasDockerEnv() || this.hasDockerCGroup();
    }

    return this._isDocker;
  }
}
