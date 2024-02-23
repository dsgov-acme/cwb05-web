import { HttpClient } from '@angular/common/http';
import { AuditEventModel } from '@dsg/shared/data-access/audit-api';
import { AgencyUsersMock, UserModel } from '@dsg/shared/data-access/user-api';
import { IUserEmployerProfile, TransactionMock, TransactionModel, TransactionPrioritiesMock, UserEmployerProfileModel } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { EventsLogService } from '@dsg/shared/feature/events';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import { LoadingService } from '@dsg/shared/ui/nuverial';
import { PagingResponseModel } from '@dsg/shared/utils/http';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockBuilder } from 'ng-mocks';
import { ReplaySubject, of } from 'rxjs';
import { TransactionEventsComponent } from './transaction-events.component';
const events = new ReplaySubject<AuditEventModel[]>(1);
const pagingMetadata = new PagingResponseModel({ nextPage: '1', pageNumber: 0, pageSize: 10, totalCount: 15 });
const user = AgencyUsersMock.users.find(u => u.id === '111');
const userMockModel = new UserModel(user);
const transactionModelMock = new TransactionModel(TransactionMock);

const userProfiles: IUserEmployerProfile = {
  displayName: 'Test Employer',
  id: '680f61b1-9225-4d88-92b2-3f3e695844a3',
  level: 'ADMIN',
  type: 'EMPLOYER',
};
const userProfiles2: IUserEmployerProfile = {
  displayName: 'Test Employer 2',
  id: '5acd9cb6-a426-4bd0-836a-a01125ce8ad8',
  level: 'WRITER',
  type: 'EMPLOYER',
};
const userProfilesMock = new UserEmployerProfileModel(userProfiles);
const userProfilesMock2 = new UserEmployerProfileModel(userProfiles2);
const userProfilesMockList = [userProfilesMock, userProfilesMock2];
const dependencies = MockBuilder(TransactionEventsComponent)
  .keep(LoadingService)
  .keep(HttpClient)
  .mock(EventsLogService, {
    clearEvents: jest.fn().mockImplementation(),
    events$: events.asObservable(),
    eventsPagination: pagingMetadata,
    initialize: jest.fn().mockImplementation(),
    loadEvents$: jest.fn().mockImplementation(() => of([])),
  })
  .mock(UserStateService, {
    getUserById$: jest.fn().mockImplementation(() => of(userMockModel)),
    getUserProfiles$: jest.fn().mockImplementation(() => of(userProfilesMockList)),
  })
  .mock(FormRendererService, {
    transaction$: of(new TransactionModel(transactionModelMock)),
  })
  .mock(EnumerationsStateService, {
    getDataFromEnum$: jest
      .fn()
      .mockImplementationOnce(() => of(TransactionPrioritiesMock.get('LOW')))
      .mockImplementationOnce(() => of(TransactionPrioritiesMock.get('MEDIUM'))),
  })
  .build();
const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(TransactionEventsComponent, {
    ...dependencies,
    ...props,
  });

  return { fixture };
};

describe('TransactionEventsComponent', () => {
  it('should create', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have no accessibility violations', async () => {
    const { fixture } = await getFixture({});
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
