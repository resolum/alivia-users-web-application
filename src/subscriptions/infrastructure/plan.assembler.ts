import { Plan } from '../domain/model/plan.entity.ts';
import type { PlanResource } from './plan.resources.ts';

export const PlanAssembler = {
  toEntity(resource: PlanResource): Plan {
    return new Plan({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      description: resource.description,
      status: resource.status,
      currency: resource.currency,
      basePriceAmount: Number(resource.basePriceAmount),
      minimumMonthlyAmount: Number(resource.minimumMonthlyAmount),
      priceQualifier: resource.priceQualifier,
      features: resource.features,
      includedDevices: resource.includedDevices,
    });
  },
};
