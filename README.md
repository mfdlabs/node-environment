# @mfdlabs/environment

This library provides a class that can be inherited to provide a consistent environment variable interface.

# Example

```typescript

// The environment class can be imported like this:
import environment from '@mfdlabs/environment';
// Or this:
import { environment } from '@mfdlabs/environment';

// We advise you create an inherited class to provide a consistent interface
// for your application. With a static instance, so you don't have to create
// a new instance every time you want to access the environment variables.

class MyEnvironment extends environment {
  // The static instance is used to access the environment variables
  public static singleton = new MyEnvironment();

  // You can define a default value for an environment variable
  // that will be used if the environment variable is not set.
  public get exampleEnvVar(): string {
    return super.getOrDefault<string>('EXAMPLE_ENV_VAR', 'default value');
  }

  // You can also define a default value that is a function.
  // This is useful if you want to use the value of another environment variable
  // to set the default value.
  public get exampleEnvVar2(): string {
    return super.getOrDefault<string>('EXAMPLE_ENV_VAR_2', () => this.exampleEnvVar);
  }
}

// You can then access the environment variables like this:
const exampleEnvVar = MyEnvironment.singleton.exampleEnvVar;

// In the future there is an idea to add decorators to make this even easier.
// And there is also an idea to allow runtime overrides of environment variables
// for testing purposes.

```

# Exports

The package exports the following:

```typescript

/* A type that represents the default value getter function */
export type DefaultValueGetter<T> = () => T;

/* A class that can be inherited to provide a consistent environment variable interface */
class environment { /* ... */ };

```

# Methods

The following methods are available on the environment class:

| Method Name     | Return Type | Is Protected? | Is Static? | Description                                                                                                                                                                                                                                                                        |
|-----------------|-------------|---------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| getOrDefault    | T           | Yes           | No         | A method for getting an environment variable, casting it or returning the default value specified in the second argument of this. If your default value is null or empty, please specify the last argument in order to correctly parse it or else it will be inferred as a string. |
| hasDockerEnv    | boolean     | No            | Yes        | A method that checks if the file /.dockerenv exists. This is not a for sure way to check for docker though.                                                                                                                                                                        |
| hasDockerCGroup | boolean     | No            | Yes        | A method that checks if the current system includes 'docker' within /proc/self/cgroup. This is not a for sure way to check for docker though.                                                                                                                                      |
| isDocker        | boolean     | No            | Yes        | A method that checks if the current system is running under docker.                                                                                                                                                                                                                |