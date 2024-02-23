import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleService } from './title.service';

describe('TitleService', () => {
  let service: TitleService;
  let ngTitleService: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Title, // Provide the real HTML title service
        TitleService,
      ],
    });
    service = TestBed.inject(TitleService);
    ngTitleService = TestBed.inject(Title);

    ngTitleService.setTitle('Test Portal');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setHtmlTitle', () => {
    it('should set the html title', () => {
      service.setHtmlTitle('test');

      const ngHtmlTitle = ngTitleService.getTitle();
      expect(ngHtmlTitle).toBe('test');
    });

    it('should include _portalTitle if includePortalTitle is true', () => {
      service['_portalTitle'].next('portal');
      service.setHtmlTitle('test', true);

      const ngHtmlTitle = ngTitleService.getTitle();
      expect(ngHtmlTitle).toBe('portal - test');
    });
  });

  it('should reset the html title', () => {
    service['_portalTitle'].next('portal');
    const spy = jest.spyOn(ngTitleService, 'setTitle');

    service.resetHtmlTitle();
    expect(spy).toBeCalledWith('portal');
  });
});
