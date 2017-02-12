export interface IConfiguration<T> {
    development: T;
    stage: T;
    test: T;
    production: T;
}
