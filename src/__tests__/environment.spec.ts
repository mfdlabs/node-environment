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
    File Name: environment.spec.ts
    Description: Environment Provider Test Specification.
    Written by: Nikita Petko
*/

/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */

import environment from '../environment';

import * as fs from 'fs';

jest.mock('fs');

const testEnv = new environment();

describe('Environment Provider', () => {
  describe('isVariableOverridden', () => {
    it('should return true if the variable is overridden', () => {
      testEnv.overrideVariable('TEST', 'test');

      expect(testEnv.isVariableOverridden('TEST')).toBe(true);

      testEnv.removeOverriddenVariable('TEST');
    });

    it('should return false if the variable is not overridden', () => {
      expect(testEnv.isVariableOverridden('TEST')).toBe(false);
    });
  });

  describe('overrideVariable', () => {
    it('should override the variable', () => {
      testEnv.overrideVariable('TEST', 'test');

      expect(testEnv.getOverridenVariable('TEST')).toBe('test');

      testEnv.removeOverriddenVariable('TEST');
    });
  });

  describe('getOverridenVariable', () => {
    it('should return the overridden variable', () => {
      testEnv.overrideVariable('TEST', 'test');

      expect(testEnv.getOverridenVariable('TEST')).toBe('test');

      testEnv.removeOverriddenVariable('TEST');
    });
  
    it('should return undefined if the variable is not overridden', () => {
      expect(testEnv.getOverridenVariable('TEST')).toBe(undefined);
    });
  });

  describe('removeOverriddenVariable', () => {
    it('should remove the overridden variable', () => {
      testEnv.overrideVariable('TEST', 'test');

      expect(testEnv.isVariableOverridden('TEST')).toBe(true);

      testEnv.removeOverriddenVariable('TEST');

      expect(testEnv.isVariableOverridden('TEST')).toBe(false);
    });
  });

  describe('getOrDefault', () => {
    it('should return the default value if the environment variable is not set', () => {
      expect(testEnv.getOrDefault('FOO_BAR', 'default')).toEqual('default');
    });

    it('should return the environment variable if it is set', () => {
      process.env.FOO_BAR = 'test';
      expect(testEnv.getOrDefault('FOO_BAR', 'default')).toEqual('test');

      delete process.env.FOO_BAR;
    });

    it('should deserialize boolean values from the environment when the default value is a boolean', () => {
      process.env.FOO_BAR = 'true';
      expect(testEnv.getOrDefault('FOO_BAR', false)).toEqual(true);

      delete process.env.FOO_BAR;

      process.env.FOO_BAR = 'false';
      expect(testEnv.getOrDefault('FOO_BAR', false)).toEqual(false);

      delete process.env.FOO_BAR;
    });

    it('should deserialize number values from the environment when the default value is a number', () => {
      process.env.FOO_BAR = '1';
      expect(testEnv.getOrDefault('FOO_BAR', 0)).toEqual(1);

      delete process.env.FOO_BAR;

      process.env.FOO_BAR = '0';
      expect(testEnv.getOrDefault('FOO_BAR', 0)).toEqual(0);

      delete process.env.FOO_BAR;
    });

    it('should use the default value as a number when the environment variable is not set and the env var is not found', () => {
      expect(testEnv.getOrDefault('FOO_BAR_BEZ', 0)).toEqual(0);
    });

    it('should call the callback function if the value is not set and the env var is not found', () => {
      const callback = () => '0';
      jest.spyOn(callback, 'call' as never);

      delete process.env.FOO_BAR;

      expect(testEnv.getOrDefault('FOO_BAR', callback)).toEqual('0');

      expect(callback.call).toHaveBeenCalled();

      delete process.env.FOO_BAR;

      // Stop spying on the callback function
      (callback.call as any).mockRestore();
    });

    it('should deserialize array values from the environment when the default value is an array', () => {
      process.env.FOO_BAR = '1,2,3';
      expect(testEnv.getOrDefault('FOO_BAR', [])).toEqual(['1', '2', '3']);

      delete process.env.FOO_BAR;
    });

    it('should deserialize array values from the environment when the default value is an array and the env var is not found', () => {
      expect(testEnv.getOrDefault('FOO_BAR_BEZ', ['0'])).toEqual(['0']);
    });

    it('should deserialize RegExp values from the environment when the default value is a RegExp', () => {
      process.env.FOO_BAR = '^foo$';
      expect(testEnv.getOrDefault('FOO_BAR', /^foo$/)).toEqual(/^foo$/);

      delete process.env.FOO_BAR;
    });

    it('should deserialize RegExp values from the environment when the default value is a RegExp and the env var is not found', () => {
      expect(testEnv.getOrDefault('FOO_BAR_BEZ', /^foo$/)).toEqual(/^foo$/);
    });

    it('should deserialize object values from the environment when the default value is an object', () => {
      process.env.FOO_BAR = '{"foo":"bar"}';
      expect(testEnv.getOrDefault('FOO_BAR', {})).toStrictEqual({ foo: 'bar' });

      delete process.env.FOO_BAR;
    });

    it('should deserialize object values from the environment when the default value is an object and the env var is not found', () => {
      expect(testEnv.getOrDefault('FOO_BAR_BEZ', { foo: 'bar' })).toStrictEqual({ foo: 'bar' });
    });

    it('should use the optional type if it specified', () => {
      process.env.FOO_BAR = '1';
      expect(testEnv.getOrDefault('FOO_BAR', 0, 'number')).toEqual(1);
      expect(testEnv.getOrDefault('FOO_BAR', 0n, 'bigint').toString()).toEqual('1');

      delete process.env.FOO_BAR;

      expect(testEnv.getOrDefault('FOO_BAR', 1n, 'bigint').toString()).toEqual('1');

      process.env.FOO_BAR = '1,2,3';
      expect(testEnv.getOrDefault<number[]>('FOO_BAR', [], 'array<number>')).toEqual([1, 2, 3]);
      expect(testEnv.getOrDefault<bigint[]>('FOO_BAR', [], 'array<bigint>')).toEqual([1n, 2n, 3n]);
      expect(testEnv.getOrDefault<string[]>('FOO_BAR', [], 'array<string>')).toEqual(['1', '2', '3']);

      process.env.FOO_BAR = 'true,false';
      expect(testEnv.getOrDefault<boolean[]>('FOO_BAR', [], 'array<boolean>')).toEqual([true, false]);

      process.env.FOO_BAR = '{"foo":"bar"},{"foo":"baz"}';
      expect(testEnv.getOrDefault<{ foo: string }[]>('FOO_BAR', [], 'array<object>')).toStrictEqual([
        { foo: 'bar' },
        { foo: 'baz' },
      ]);

      process.env.FOO_BAR = '^foo$,^bar$';
      expect(testEnv.getOrDefault<RegExp[]>('FOO_BAR', [], 'array<regexp>')).toEqual([/^foo$/, /^bar$/]);

      delete process.env.FOO_BAR;
      expect(testEnv.getOrDefault<bigint[]>('FOO_BAR', [1n], 'array<bigint>')).toEqual([1n]);
      expect(testEnv.getOrDefault<number[]>('FOO_BAR', [3, 2, 1], 'array<number>')).toEqual([3, 2, 1]);
      expect(testEnv.getOrDefault<string[]>('FOO_BAR', ['foo', 'bar'], 'array<string>')).toEqual(['foo', 'bar']);
      expect(testEnv.getOrDefault<boolean[]>('FOO_BAR', [false, true, false], 'array<boolean>')).toEqual([false, true, false]);
      expect(testEnv.getOrDefault<{ foo: string }[]>('FOO_BAR', [{ foo: 'bar' }], 'array<object>')).toStrictEqual([
        { foo: 'bar' },
      ]);

      process.env.FOO_BAR = '^foo$';
      expect(testEnv.getOrDefault('FOO_BAR', /^foo$/, 'regexp')).toEqual(/^foo$/);

      delete process.env.FOO_BAR;

      expect(testEnv.getOrDefault('FOO_BAR', /^foo$/, 'regexp')).toEqual(/^foo$/);

      process.env.FOO_BAR = '{"foo":"bar"}';
      expect(testEnv.getOrDefault('FOO_BAR', {}, 'object')).toStrictEqual({ foo: 'bar' });

      expect(testEnv.getOrDefault('FOO_BAR', undefined, 'object')).toStrictEqual({ foo: 'bar' });

      delete process.env.FOO_BAR;

      expect(testEnv.getOrDefault('FOO_BAR', null)).toBeNull();

      delete process.env.FOO_BAR;
    });

    it('should return the override value if it is specified', () => {
      process.env.FOO_BAR = '1';
      
      testEnv.overrideVariable('FOO_BAR', 2);

      expect(testEnv.getOrDefault('FOO_BAR', 0)).toEqual(2);

      testEnv.removeOverriddenVariable('FOO_BAR');

      delete process.env.FOO_BAR;
    });
  });

  describe('hasDockerEnv', () => {
    it('should return true if the system has a /.dockerenv file', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.existsSync as any).mockReturnValue(true);
      expect(environment.hasDockerEnv()).toBe(true);
      (fs.existsSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return false if the system does not have a /.dockerenv file', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.existsSync as any).mockReturnValue(false);
      expect(environment.hasDockerEnv()).toBe(false);
      (fs.existsSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return false if the system is not a linux system', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(environment.hasDockerEnv()).toBe(false);

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });
  });

  describe('hasDockerCGroup', () => {
    it("should return true if the system's cgroup contains the docker cgroup", () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.readFileSync as any).mockReturnValue('docker');
      expect(environment.hasDockerCGroup()).toBe(true);
      (fs.readFileSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it("should return false if the system's cgroup does not contain the docker cgroup", () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.readFileSync as any).mockReturnValue('foo');
      expect(environment.hasDockerCGroup()).toBe(false);
      (fs.readFileSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return false if the system is not a linux system', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(environment.hasDockerCGroup()).toBe(false);

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });
    it("should return false if the system's cgroup does not exist", () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      expect(environment.hasDockerCGroup()).toBe(false);
      (fs.readFileSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });
  });

  describe('isDocker', () => {
    it('should return true if the system has a .dockerenv file and no cgroup', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.existsSync as any).mockReturnValue(true);
      expect(environment.isDocker()).toBe(true);
      (fs.existsSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return false if the system does not have a .dockerenv file and no cgroup', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (environment as any)._isDocker = false;
      expect(environment.isDocker()).toBe(false);

      delete (environment as any)._isDocker;

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return true if the system does not have a .dockerenv file and has a cgroup', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (fs.existsSync as any).mockReturnValue(false);
      (fs.readFileSync as any).mockReturnValue('docker');
      expect(environment.isDocker()).toBe(true);
      (fs.existsSync as any).mockClear();
      (fs.readFileSync as any).mockClear();

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return true if the system has a .dockerenv file and has a cgroup', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      (environment as any)._isDocker = true;
      expect(environment.isDocker()).toBe(true);

      delete (environment as any)._isDocker;

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });

    it('should return false if the system is not a linux system', () => {
      const orignalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(environment.isDocker()).toBe(false);

      Object.defineProperty(process, 'platform', {
        value: orignalPlatform,
      });
    });
  });
});
