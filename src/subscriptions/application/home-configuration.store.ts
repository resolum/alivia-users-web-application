import { HomeConfiguration, type DeviceType, type RoomConfiguration } from '../domain/model/home-configuration.ts';
import { PlanSelection, type PlanSelectionProps } from '../domain/model/plan-selection.ts';
import { ConfigurationDraftRequestError, getConfigurationDraftsApi } from '../infrastructure/configuration-drafts-api.ts';
import { savePlanSelection } from '../infrastructure/plan-selection.storage.ts';

export async function loadHomeConfiguration(selection: PlanSelectionProps): Promise<HomeConfiguration> {
  const api = getConfigurationDraftsApi();
  try {
    return await api.getDraft(selection.draftId);
  } catch (error) {
    if (!(error instanceof ConfigurationDraftRequestError) || error.status !== 404) throw error;

    const recreated = await api.createDraft(selection.planCode, selection.billingPeriod);
    savePlanSelection(new PlanSelection({
      draftId: recreated.draftId,
      planCode: selection.planCode,
      billingPeriod: selection.billingPeriod,
      amount: selection.amount,
      selectedAt: selection.selectedAt,
    }));
    return recreated;
  }
}

export async function changeDeviceQuantity(
  configuration: HomeConfiguration,
  roomId: string,
  type: DeviceType,
  quantity: number,
): Promise<HomeConfiguration> {
  const updated = configuration.updateDevice(roomId, type, quantity);
  return getConfigurationDraftsApi().replaceRooms(updated.draftId, updated.rooms);
}

export function replaceConfiguredRooms(
  configuration: HomeConfiguration,
  rooms: readonly RoomConfiguration[],
): Promise<HomeConfiguration> {
  return getConfigurationDraftsApi().replaceRooms(configuration.draftId, rooms);
}
