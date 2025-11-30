/**
 * Cloud Service Interfaces
 *
 * Export all interfaces for cloud service abstraction.
 * These interfaces allow switching between Firebase and Azure implementations.
 */

// Common types
export * from './types';

// Service interfaces
export * from './auth';
export * from './database';
export * from './analytics';
export * from './messaging';
export * from './functions';
