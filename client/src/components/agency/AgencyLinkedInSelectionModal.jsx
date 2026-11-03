import React from 'react';
import { Building2, Linkedin, User } from 'lucide-react';

const AgencyLinkedInSelectionModal = ({
  linkedInSelectionData,
  selectingLinkedInAccount,
  handleLinkedInSelection,
  setShowLinkedInSelection,
  setLinkedInSelectionData,
}) => {
  if (!linkedInSelectionData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Linkedin className="h-5 w-5" />
            Select LinkedIn Account
          </h3>
          <p className="mt-1 text-sm text-blue-100">
            Choose which LinkedIn profile or page should become a shared team connection.
          </p>
        </div>

        <div className="space-y-4 p-6">
          {!linkedInSelectionData.personalConnected && (
            <button
              type="button"
              onClick={() => handleLinkedInSelection('personal')}
              disabled={selectingLinkedInAccount}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900">Personal Profile</div>
                <div className="truncate text-sm text-gray-500">
                  {linkedInSelectionData.userName || 'Use the connected LinkedIn profile'}
                </div>
              </div>
            </button>
          )}

          {linkedInSelectionData.personalConnected && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
              <User className="h-5 w-5" />
              Personal profile already connected for this team.
            </div>
          )}

          <div className="border-t pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500">
              <Building2 className="h-4 w-4" />
              Organization Pages
            </div>

            <div className="space-y-2">
              {linkedInSelectionData.organizations.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => handleLinkedInSelection('organization', organization.id)}
                  disabled={selectingLinkedInAccount}
                  className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
                >
                  {organization.logo ? (
                    <img
                      src={organization.logo}
                      alt={organization.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900">{organization.name}</div>
                    <div className="text-sm text-gray-500">LinkedIn organization page</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setShowLinkedInSelection(false);
              setLinkedInSelectionData(null);
            }}
            disabled={selectingLinkedInAccount}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 transition hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgencyLinkedInSelectionModal;
